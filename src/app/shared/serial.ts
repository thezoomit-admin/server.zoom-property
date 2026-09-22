import { FilterQuery, Model } from "mongoose";

/**
 * List serials (`order`): unique, starting at 1, no gaps.
 *
 * Areas, projects and listings share this so the Order column means the same
 * thing on every screen — 1 is first, two rows never share a number, and a
 * move shuffles the neighbours rather than leaving a hole or a clash.
 */
const liveFilter = { isDeleted: { $ne: true } };

const live = <T>(extra: FilterQuery<T> = {}) =>
  ({ ...liveFilter, ...extra }) as FilterQuery<T>;

export const nextSerial = async (model: Model<any>) => {
  const last = await model.findOne(live()).sort({ order: -1 }).select("order");
  const max = typeof last?.order === "number" ? last.order : 0;
  return Math.max(max, 0) + 1;
};

/** Serial for a new row. An explicit 1…n inserts at that slot and shifts the rest. */
export const takeSerial = async (
  model: Model<any>,
  requested?: number | null
) => {
  const next = await nextSerial(model);
  if (requested === undefined || requested === null || requested < 1) {
    return next;
  }

  const order = Math.min(Math.trunc(requested), next);
  if (order < next) {
    await model.updateMany(live({ order: { $gte: order } }), {
      $inc: { order: 1 },
    });
  }
  return order;
};

/** Move one row; neighbours between the old and new slots shift to keep uniqueness. */
export const moveSerial = async (
  model: Model<any>,
  id: string,
  from: number | undefined,
  to: number
) => {
  const count = await model.countDocuments(live());
  const order = Math.max(1, Math.min(Math.trunc(to), Math.max(count, 1)));
  const current = typeof from === "number" && from >= 1 ? from : 0;

  if (current === order) return order;

  if (current < 1) {
    await model.updateMany(
      live({ _id: { $ne: id }, order: { $gte: order } }),
      { $inc: { order: 1 } }
    );
    return order;
  }

  if (order < current) {
    await model.updateMany(
      live({
        _id: { $ne: id },
        order: { $gte: order, $lt: current },
      }),
      { $inc: { order: 1 } }
    );
  } else {
    await model.updateMany(
      live({
        _id: { $ne: id },
        order: { $gt: current, $lte: order },
      }),
      { $inc: { order: -1 } }
    );
  }

  return order;
};

/** Rewrite live rows to 1, 2, 3… in current list order. */
export const compactSerials = async (model: Model<any>) => {
  const rows = await model
    .find(live())
    .sort({ order: 1, createdAt: 1 })
    .select("_id order");

  let moved = 0;
  for (let i = 0; i < rows.length; i += 1) {
    const serial = i + 1;
    if (rows[i].order !== serial) {
      await model.updateOne({ _id: rows[i]._id }, { $set: { order: serial } });
      moved += 1;
    }
  }

  return { total: rows.length, moved };
};

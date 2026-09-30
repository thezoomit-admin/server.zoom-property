import { Agent } from "./agent.model";
import { IAgent } from "./agent.interface";
import QueryBuilder from "../../builder/QueryBuilder";


const createAgent = async (payload: Partial<IAgent>) => {
  const result = await Agent.create(payload);
  return result;
};

const getAllAgents = async (query: Record<string, unknown>) => {
  // `isActive=true` arrives as the string "true" over the query string —
  // matched against QueryBuilder's raw pass-through filter it would compare
  // to the schema's real boolean and match nothing, so it's pulled out and
  // cast by hand instead (the same fix `area.service.ts` uses for the same
  // problem).
  const { isActive, ...restQuery } = query;
  const baseFilter: Record<string, unknown> = {};
  if (isActive === "true") baseFilter.isActive = true;
  if (isActive === "false") baseFilter.isActive = false;

  const agentQuery = new QueryBuilder(
    Agent.find(baseFilter).populate("image"),
    restQuery
  )
    .search(["name", "role", "patch", "languages"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await agentQuery.modelQuery;
  const meta = await agentQuery.countTotal();

  return {
    meta,
    data: result,
  };
};

const getSingleAgent = async (id: string) => {
  const result = await Agent.findById(id).populate("image");
  return result;
};

const updateAgent = async (id: string, payload: Partial<IAgent>) => {
  const result = await Agent.findByIdAndUpdate(id, payload, {
    new: true,
  }).populate("image");
  return result;
};

const deleteAgent = async (id: string) => {
  const result = await Agent.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
  return result;
};

export const AgentService = {
  createAgent,
  getAllAgents,
  getSingleAgent,
  updateAgent,
  deleteAgent,
};

import { Document, Types } from "mongoose";

export const LANDING_SECTIONS = [
  "hero",
  "about",
  "residences",
  "elevation",
  "films",
  "amenities",
  "gallery",
  "location",
  "process",
  "cta",
  "reviews",
  "faq",
  "enquire",
] as const;

export type LandingSectionKey = (typeof LANDING_SECTIONS)[number];

export interface ILandingSectionFlag {
  visible: boolean;
}

export interface ILandingStat {
  value?: string;
  valueBn?: string;
  label?: string;
  labelBn?: string;
  icon?: string;
}

export interface ILandingPoint {
  title?: string;
  titleBn?: string;
  body?: string;
  bodyBn?: string;
  icon?: string;
}

export interface ILandingHighlight {
  label?: string;
  labelBn?: string;
  value?: string;
  valueBn?: string;
  icon?: string;
}

export interface ILandingView {
  label?: string;
  labelBn?: string;
  hint?: string;
  hintBn?: string;
  image?: Types.ObjectId;
}

export interface ILandingFilm {
  title?: string;
  titleBn?: string;
  caption?: string;
  captionBn?: string;
  url?: string;
  poster?: Types.ObjectId;
  provider?: "facebook" | "youtube";
}

export interface ILandingShot {
  label?: string;
  labelBn?: string;
  image?: Types.ObjectId;
}

export interface ILandingFact {
  label?: string;
  labelBn?: string;
  value?: string;
  valueBn?: string;
}

export interface ILandingStep {
  title?: string;
  titleBn?: string;
  body?: string;
  bodyBn?: string;
}

export interface ILandingReview {
  name?: string;
  nameBn?: string;
  role?: string;
  roleBn?: string;
  quote?: string;
  quoteBn?: string;
  avatar?: Types.ObjectId;
  poster?: Types.ObjectId;
  videoUrl?: string;
}

export interface ILandingFaq {
  question?: string;
  questionBn?: string;
  answer?: string;
  answerBn?: string;
}

export interface IProjectLanding extends Document {
  project: Types.ObjectId;
  path: string;
  isActive: boolean;
  facebookUrl?: string;
  phonePrimary?: string;
  phoneSecondary?: string;
  whatsapp?: string;
  metaTitle?: string;
  metaTitleBn?: string;
  metaDescription?: string;
  metaDescriptionBn?: string;
  navEnquire?: string;
  navEnquireBn?: string;
  sections: Record<LandingSectionKey, ILandingSectionFlag>;
  hero: {
    image?: Types.ObjectId;
    badge?: string;
    badgeBn?: string;
    handover?: string;
    handoverBn?: string;
    eyebrow?: string;
    eyebrowBn?: string;
    title?: string;
    titleBn?: string;
    lead?: string;
    leadBn?: string;
    location?: string;
    locationBn?: string;
    ctaPrimary?: string;
    ctaPrimaryBn?: string;
    ctaSecondary?: string;
    ctaSecondaryBn?: string;
    stats: ILandingStat[];
  };
  about: {
    image?: Types.ObjectId;
    eyebrow?: string;
    eyebrowBn?: string;
    title?: string;
    titleBn?: string;
    body?: string;
    bodyBn?: string;
    points: ILandingPoint[];
  };
  residences: {
    images: Types.ObjectId[];
    eyebrow?: string;
    eyebrowBn?: string;
    title?: string;
    titleBn?: string;
    description?: string;
    descriptionBn?: string;
    featured?: string;
    featuredBn?: string;
    cta?: string;
    ctaBn?: string;
    preview?: string;
    previewBn?: string;
    close?: string;
    closeBn?: string;
    unit: {
      name?: string;
      nameBn?: string;
      beds?: string;
      bedsBn?: string;
      baths?: string;
      bathsBn?: string;
      size?: string;
      sizeBn?: string;
      price?: string;
      priceBn?: string;
      note?: string;
      noteBn?: string;
    };
    highlights: ILandingHighlight[];
  };
  elevation: {
    eyebrow?: string;
    eyebrowBn?: string;
    title?: string;
    titleBn?: string;
    description?: string;
    descriptionBn?: string;
    preview?: string;
    previewBn?: string;
    close?: string;
    closeBn?: string;
    views: ILandingView[];
  };
  films: {
    eyebrow?: string;
    eyebrowBn?: string;
    title?: string;
    titleBn?: string;
    description?: string;
    descriptionBn?: string;
    play?: string;
    playBn?: string;
    items: ILandingFilm[];
  };
  amenities: {
    eyebrow?: string;
    eyebrowBn?: string;
    title?: string;
    titleBn?: string;
    description?: string;
    descriptionBn?: string;
    items: ILandingPoint[];
  };
  gallery: {
    eyebrow?: string;
    eyebrowBn?: string;
    title?: string;
    titleBn?: string;
    open?: string;
    openBn?: string;
    close?: string;
    closeBn?: string;
    shots: ILandingShot[];
  };
  location: {
    eyebrow?: string;
    eyebrowBn?: string;
    title?: string;
    titleBn?: string;
    description?: string;
    descriptionBn?: string;
    mapOpen?: string;
    mapOpenBn?: string;
    mapHint?: string;
    mapHintBn?: string;
    mapEmbedUrl?: string;
    mapLinkUrl?: string;
    facts: ILandingFact[];
  };
  process: {
    eyebrow?: string;
    eyebrowBn?: string;
    title?: string;
    titleBn?: string;
    steps: ILandingStep[];
  };
  cta: {
    eyebrow?: string;
    eyebrowBn?: string;
    title?: string;
    titleBn?: string;
    description?: string;
    descriptionBn?: string;
    primary?: string;
    primaryBn?: string;
    call?: string;
    callBn?: string;
    whatsapp?: string;
    whatsappBn?: string;
  };
  reviews: {
    eyebrow?: string;
    eyebrowBn?: string;
    title?: string;
    titleBn?: string;
    description?: string;
    descriptionBn?: string;
    play?: string;
    playBn?: string;
    close?: string;
    closeBn?: string;
    items: ILandingReview[];
  };
  faq: {
    eyebrow?: string;
    eyebrowBn?: string;
    title?: string;
    titleBn?: string;
    description?: string;
    descriptionBn?: string;
    items: ILandingFaq[];
  };
  enquire: {
    eyebrow?: string;
    eyebrowBn?: string;
    title?: string;
    titleBn?: string;
    description?: string;
    descriptionBn?: string;
    phoneLabel?: string;
    phoneLabelBn?: string;
    whatsappLabel?: string;
    whatsappLabelBn?: string;
    source?: string;
    form: {
      name?: string;
      nameBn?: string;
      namePlaceholder?: string;
      namePlaceholderBn?: string;
      phone?: string;
      phoneBn?: string;
      email?: string;
      emailBn?: string;
      plan?: string;
      planBn?: string;
      message?: string;
      messageBn?: string;
      messagePlaceholder?: string;
      messagePlaceholderBn?: string;
      submit?: string;
      submitBn?: string;
      submitting?: string;
      submittingBn?: string;
      privacy?: string;
      privacyBn?: string;
      successTitle?: string;
      successTitleBn?: string;
      successBody?: string;
      successBodyBn?: string;
    };
  };
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

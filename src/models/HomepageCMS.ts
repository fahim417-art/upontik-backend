import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHeroSlide {
  id: string;
  eyebrow?: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  desktopImage: string;
  mobileImage?: string;
  isActive: boolean;
}

export interface IBrandBenefit {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface IBrandJourneyStep {
  stepNumber: string;
  title: string;
  description: string;
  icon?: string;
}

export interface ILifestyleCollection {
  title: string;
  description: string;
  image: string;
  link: string;
}

export interface ISocialVideo {
  id: string;
  title: string;
  description: string;
  category: string;
  videoUrl: string;
  thumbnailUrl: string;
  isFeatured: boolean;
}

export interface IProductCareGuide {
  material: string;
  title: string;
  tips: string[];
}

export interface IHomepageCMS extends Document {
  announcementBar: {
    text: string;
    link?: string;
    isActive: boolean;
    showSocials: boolean;
  };
  heroSlides: IHeroSlide[];
  brandBenefits: IBrandBenefit[];
  brandStory: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    content: string;
    ctaText: string;
    ctaLink: string;
    image: string;
    videoUrl?: string;
  };
  brandJourney: IBrandJourneyStep[];
  bagFinder: {
    title: string;
    subtitle: string;
    isActive: boolean;
  };
  signatureCollection: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    description: string;
    ctaText: string;
    ctaLink: string;
    image: string;
    isActive: boolean;
  };
  lifestyleCollections: ILifestyleCollection[];
  teamStory: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    content: string;
    image: string;
    isActive: boolean;
  };
  videos: ISocialVideo[];
  careGuides: IProductCareGuide[];
  giftSection: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    description: string;
    ctaText: string;
    ctaLink: string;
    image: string;
    isActive: boolean;
  };
  socialLinks: {
    facebook: string;
    instagram: string;
    youtube: string;
    whatsapp: string;
    whatsappNumber: string;
    defaultMessage: string;
  };
  finalCta: {
    title: string;
    description: string;
    ctaText: string;
    ctaLink: string;
    image: string;
    isActive: boolean;
  };
  campaign: {
    title: string;
    subtitle: string;
    description: string;
    ctaText: string;
    ctaLink: string;
    image: string;
    isActive: boolean;
  };
  instagramGallery: Array<{
    imageUrl: string;
    caption?: string;
    permalink?: string;
  }>;
  newsletter: {
    title: string;
    subtitle: string;
  };
  updatedAt: Date;
}

const HeroSlideSchema = new Schema<IHeroSlide>(
  {
    id: { type: String, required: true },
    eyebrow: { type: String, default: "ARTISAN BAGS • TIMELESS DESIGN" },
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    ctaText: { type: String, default: "Explore Our Collection" },
    ctaLink: { type: String, default: "/shop" },
    secondaryCtaText: { type: String, default: "Watch Our Story" },
    secondaryCtaLink: { type: String, default: "/story" },
    desktopImage: { type: String, required: true },
    mobileImage: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const BrandBenefitSchema = new Schema<IBrandBenefit>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: "Hand" },
  },
  { _id: false }
);

const BrandJourneyStepSchema = new Schema<IBrandJourneyStep>(
  {
    stepNumber: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String },
  },
  { _id: false }
);

const LifestyleCollectionSchema = new Schema<ILifestyleCollection>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    link: { type: String, default: "/shop" },
  },
  { _id: false }
);

const SocialVideoSchema = new Schema<ISocialVideo>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, default: "Behind the Scenes" },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    isFeatured: { type: Boolean, default: false },
  },
  { _id: false }
);

const ProductCareGuideSchema = new Schema<IProductCareGuide>(
  {
    material: { type: String, required: true },
    title: { type: String, required: true },
    tips: [{ type: String }],
  },
  { _id: false }
);

const HomepageCMSSchema = new Schema<IHomepageCMS>(
  {
    announcementBar: {
      text: { type: String, default: "Free Shipping across Bangladesh • Handmade with Love" },
      link: { type: String, default: "/shop" },
      isActive: { type: Boolean, default: true },
      showSocials: { type: Boolean, default: true },
    },
    heroSlides: [HeroSlideSchema],
    brandBenefits: [BrandBenefitSchema],
    brandStory: {
      eyebrow: { type: String, default: "THE ARTISAN NARRATIVE" },
      title: { type: String, default: "Behind Every Bag, There Is a Story." },
      subtitle: { type: String, default: "Discover the thought, creativity, and care behind our collections." },
      content: {
        type: String,
        default:
          "At UPONTIK, each piece is born from a deep dialogue between generational artisan heritage and contemporary silhouette design. Our textile bags weave intricate patterns, natural textures, and structural wooden elements into enduring fashion statements.",
      },
      ctaText: { type: String, default: "Learn Our Story" },
      ctaLink: { type: String, default: "/story" },
      image: {
        type: String,
        default:
          "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=85&w=1200",
      },
      videoUrl: { type: String, default: "https://www.facebook.com/share/r/1A4gbDNKhE/" },
    },
    brandJourney: [BrandJourneyStepSchema],
    bagFinder: {
      title: { type: String, default: "Find Your Perfect Bag." },
      subtitle: { type: String, default: "Not sure which bag suits your style? Let us help you discover." },
      isActive: { type: Boolean, default: true },
    },
    signatureCollection: {
      eyebrow: { type: String, default: "HERITAGE ARCHITECTURE" },
      title: { type: String, default: "The UPONTIK Signature Collection" },
      subtitle: { type: String, default: "Sculptural silhouettes carved from solid teak and woven on heritage looms." },
      description: {
        type: String,
        default:
          "Our signature Dhol Bag embodies acoustic symmetry and generational woodwork, paired with rich loomed cotton weave.",
      },
      ctaText: { type: String, default: "Discover Signature Pieces" },
      ctaLink: { type: String, default: "/category/dhol-bag" },
      image: {
        type: String,
        default:
          "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=85&w=1400",
      },
      isActive: { type: Boolean, default: true },
    },
    lifestyleCollections: [LifestyleCollectionSchema],
    teamStory: {
      eyebrow: { type: String, default: "THE ATELIER" },
      title: { type: String, default: "Meet the People Behind the Brand." },
      subtitle: { type: String, default: "Generational weavers, wood carvers, and modern textile designers." },
      content: {
        type: String,
        default:
          "UPONTIK brings together master craftspeople who have spent decades perfecting the art of loom weaving and wood turning with contemporary accessories designers who understand modern daily needs.",
      },
      image: {
        type: String,
        default:
          "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=85&w=1200",
      },
      isActive: { type: Boolean, default: true },
    },
    videos: [SocialVideoSchema],
    careGuides: [ProductCareGuideSchema],
    giftSection: {
      eyebrow: { type: String, default: "BESPOKE GIFTING" },
      title: { type: String, default: "A Thoughtful Gift, Made Special." },
      subtitle: { type: String, default: "Present the timeless beauty of handcrafted art to those you cherish." },
      description: {
        type: String,
        default:
          "Every gift order is packaged in our signature cotton dust bag with an artisan certificate of authenticity.",
      },
      ctaText: { type: String, default: "Explore Gift Collection" },
      ctaLink: { type: String, default: "/shop?collection=gifts" },
      image: {
        type: String,
        default:
          "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=85&w=1200",
      },
      isActive: { type: Boolean, default: true },
    },
    socialLinks: {
      facebook: { type: String, default: "https://www.facebook.com/share/1CYhYuFu83/" },
      instagram: { type: String, default: "https://instagram.com/upontik" },
      youtube: { type: String, default: "https://youtube.com/@upontik" },
      whatsapp: { type: String, default: "https://wa.me/8801981315294" },
      whatsappNumber: { type: String, default: "+8801981315294" },
      defaultMessage: {
        type: String,
        default: "Hello UPONTIK! I would like to inquire about your handcrafted bag collection.",
      },
    },
    finalCta: {
      title: { type: String, default: "Your Next Favourite Bag Is Waiting." },
      description: {
        type: String,
        default:
          "Explore the UPONTIK collection and find a design that becomes part of your everyday story.",
      },
      ctaText: { type: String, default: "Explore the Collection" },
      ctaLink: { type: String, default: "/shop" },
      image: {
        type: String,
        default:
          "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=85&w=1600",
      },
      isActive: { type: Boolean, default: true },
    },
    campaign: {
      title: { type: String, default: "The Heritage Edit" },
      subtitle: { type: String, default: "Curated Autumn / Winter Series" },
      description: {
        type: String,
        default:
          "Explore a collection shaped by raw woven textures, earthy saffron tones, and timeless tactile geometry.",
      },
      ctaText: { type: String, default: "Shop The Campaign" },
      ctaLink: { type: String, default: "/shop?collection=heritage-edit" },
      image: {
        type: String,
        default:
          "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=85&w=1600",
      },
      isActive: { type: Boolean, default: true },
    },
    instagramGallery: [
      {
        imageUrl: { type: String, required: true },
        caption: { type: String },
        permalink: { type: String },
      },
    ],
    newsletter: {
      title: { type: String, default: "Letters From UPONTIK." },
      subtitle: {
        type: String,
        default:
          "Be the first to discover new collections, updates, and special announcements.",
      },
    },
  },
  { timestamps: true }
);

export const HomepageCMS: Model<IHomepageCMS> =
  mongoose.models.HomepageCMS ||
  mongoose.model<IHomepageCMS>("HomepageCMS", HomepageCMSSchema);

import mongoose from "mongoose";
import config from "./src/app/config";
import { Project } from "./src/app/modules/project/project.model";
import { Media } from "./src/app/modules/media-library/media-library.model";

const seedFeatures = async () => {
  try {
    await mongoose.connect(config.db_url as string);
    console.log("Connected to database...");

    const project = await Project.findOne({ isDeleted: { $ne: true }, isActive: true });
    if (!project) {
      console.log("No active project found!");
      return;
    }

    // Attempt to fetch some existing images to use, or fallback to external URLs (although Media keys are usually S3 keys, we will use hardcoded beautiful unsplash URLs if the UI supports it, but the UI expects a media object id. We will create dummy Media records with external URLs as keys to make it work beautifully if needed, or better just use existing images).
    // Let's create a few dummy media records to use for the features
    const images = [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
      "https://images.unsplash.com/photo-1591825729269-caeb344f6df2?w=800&q=80",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80",
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
      "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80",
      "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80",
      "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80"
    ];

    const mediaIds: any[] = [];
    for (let i = 0; i < images.length; i++) {
      const m = await Media.create({
        key: images[i],
        name: `feature-image-${i}.jpg`,
        type: "image/jpeg",
        mediaType: "image",
        size: 1024,
      });
      mediaIds.push(m._id);
    }

    project.features = [
      {
        eyebrow: "Exterior",
        eyebrowBn: "বহিরাঙ্গন",
        title: "Modern Architecture",
        titleBn: "আধুনিক স্থাপত্য",
        description: "<p>A <strong>masterpiece</strong> of contemporary design, featuring elegant brickwork, expansive balconies, and a structure built for modern living.</p><ul><li>Premium materials</li><li>Eco-friendly design</li><li>Weather-resistant finishes</li></ul>",
        descriptionBn: "<p>একটি <strong>অনবদ্য</strong> আধুনিক ডিজাইন।</p>",
        image: mediaIds[0],
      },
      {
        eyebrow: "Living",
        eyebrowBn: "বসার ঘর",
        title: "Spacious Drawing Room",
        titleBn: "প্রশস্ত ড্রয়িং রুম",
        description: "<p>A bright, open living space built for everyday comfort. Designed with <em>cross-ventilation</em> and maximum natural light.</p>",
        descriptionBn: "<p>আলোকিত ও খোলামেলা বসার ঘর।</p>",
        image: mediaIds[1],
      },
      {
        eyebrow: "Comfort",
        eyebrowBn: "আরাম",
        title: "Master Bedroom",
        titleBn: "মাস্টার বেডরুম",
        description: "<p>Spacious, well-lit bedrooms designed for a quiet rest. Includes built-in wardrobes and an en-suite luxury bathroom.</p>",
        descriptionBn: "<p>প্রশস্ত ও আরামদায়ক বেডরুম।</p>",
        image: mediaIds[2],
      },
      {
        eyebrow: "Health",
        eyebrowBn: "স্বাস্থ্য",
        title: "Fully Equipped Gym",
        titleBn: "আধুনিক জিম",
        description: "<p>A state-of-the-art fitness center available exclusively for residents. Stay fit without leaving the comfort of your home.</p>",
        image: mediaIds[3],
      },
      {
        eyebrow: "Dining",
        eyebrowBn: "ডাইনিং",
        title: "Family Dining Area",
        titleBn: "পারিবারিক ডাইনিং",
        description: "<p>A dedicated dining space made for everyday family meals, seamlessly connected to the open-plan kitchen.</p>",
        image: mediaIds[4],
      },
      {
        eyebrow: "Automation",
        eyebrowBn: "অটোমেশন",
        title: "Smart Home Integration",
        titleBn: "স্মার্ট হোম",
        description: "<p>Control locks, lighting, and climate from your phone, anywhere in the world. Experience the true power of IoT.</p>",
        image: mediaIds[5],
      },
      {
        eyebrow: "Safety",
        eyebrowBn: "নিরাপত্তা",
        title: "24/7 Security",
        titleBn: "২৪/৭ নিরাপত্তা",
        description: "<p>Round-the-clock <strong>CCTV monitoring</strong> and on-site professional guards at every entrance to ensure complete peace of mind.</p>",
        image: mediaIds[6],
      },
      {
        eyebrow: "Leisure",
        eyebrowBn: "অবসর",
        title: "Rooftop Garden",
        titleBn: "ছাদ বাগান",
        description: "<p>A beautifully landscaped rooftop terrace with seating areas and BBQ facilities, perfect for evening gatherings.</p>",
        image: mediaIds[7],
      },
      {
        eyebrow: "Convenience",
        eyebrowBn: "সুবিধা",
        title: "High-Speed Elevators",
        titleBn: "উচ্চ গতির লিফট",
        description: "<p>Dual high-speed passenger elevators with full power backup, ensuring you never have to wait.</p>",
        image: mediaIds[8],
      },
      {
        eyebrow: "Parking",
        eyebrowBn: "পার্কিং",
        title: "Secure Basement Parking",
        titleBn: "নিরাপদ পার্কিং",
        description: "<p>Spacious and well-lit basement parking with automated entry systems and electric vehicle (EV) charging provisions.</p>",
        image: mediaIds[9],
      }
    ];

    await project.save();
    console.log("Successfully seeded 10 features to project:", project.name);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding features:", error);
    process.exit(1);
  }
};

seedFeatures();

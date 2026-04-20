import Flat from "../models/flat.js";

export const searchFlats = async (req, res) => {
  try {
    const { state, district, city, locality, country, pincode, type, minPrice, maxPrice } = req.query;
    const query = { sold: { $ne: true }, rented: { $ne: true }, visible: { $ne: false } };

    const locationTerms = [state, district, city, locality, country, pincode].filter(Boolean);
    if (locationTerms.length) {
      query.$and = locationTerms.map((term) => ({
        $or: [
          { state: { $regex: term, $options: "i" } },
          { district: { $regex: term, $options: "i" } },
          { city: { $regex: term, $options: "i" } },
          { locality: { $regex: term, $options: "i" } },
          { country: { $regex: term, $options: "i" } },
          { pincode: { $regex: term, $options: "i" } },
          { location: { $regex: term, $options: "i" } },
        ],
      }));
    }

    if (type) query.type = type;
    if (minPrice) query.price = { ...query.price, $gte: Number(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: Number(maxPrice) };
    const flats = await Flat.find(query);
    res.json(flats);
  } catch (err) {
    console.error("searchFlats error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getLocationOptions = async (req, res) => {
  try {
    const { field, state, district, city } = req.query;
    const match = { sold: { $ne: true }, rented: { $ne: true }, visible: { $ne: false } };
    if (field === "district" && state) match.state = { $regex: state, $options: "i" };
    if (field === "city" && district) match.district = { $regex: district, $options: "i" };
    if (field === "locality" && city) match.city = { $regex: city, $options: "i" };
    const values = await Flat.distinct(field, match);
    res.json(values.filter(Boolean).sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

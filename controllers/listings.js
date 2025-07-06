const Listing=require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken=process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index=async (req,res) => {
    const allListings=await Listing.find({});
    res.render("listings/index.ejs",{allListings});
};

module.exports.renderNewForm=(req, res) => {
    console.log(req.user);
    res.render("listings/new.ejs", { listing: { image: { url: "" } } });
};

module.exports.showListing=async (req,res) => {
    let {id}=req.params;
    const listing=await Listing.findById(id).populate({path:"reviews",populate:{path:"author"},}).populate("owner");
    if(!listing) {
        req.flash("error","Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs",{listing});
};

module.exports.createListing = async (req, res, next) => {
    try {
        console.log("Creating listing with data:", req.body.listing);
        
        let response = await geocodingClient.forwardGeocode({
            query: req.body.listing.location,
            limit: 1,
        }).send();

        console.log("Mapbox response:", JSON.stringify(response.body, null, 2));

        if (!response.body.features.length) {
            throw new ExpressError("Invalid location provided", 400);
        }

        const { path: url, filename } = req.file;
        
        // Log the geometry from Mapbox
        const mapboxGeometry = response.body.features[0].geometry;
        console.log("Mapbox geometry:", mapboxGeometry);

        // Create geometry object
        const geometry = {
            type: "Point",
            coordinates: mapboxGeometry.coordinates
        };
        console.log("Created geometry object:", geometry);

        // Create the listing with all required fields
        const listingData = {
            ...req.body.listing,
            owner: req.user._id,
            image: { url, filename },
            geometry: geometry
        };
        console.log("Listing data before creation:", listingData);

        const newListing = new Listing(listingData);
        console.log("New listing object:", newListing);

        const savedListing = await newListing.save();
        console.log("Saved listing:", savedListing);
        
        req.flash("success", "New Listing Created!");
        res.redirect("/listings");
    } catch (err) {
        console.error("Error creating listing:", err);
        next(err);
    }
};

module.exports.renderEditForm=async(req,res) => {
    let {id}=req.params;
    const listing=await Listing.findById(id);
    if(!listing) {
        req.flash("error","Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    let originalImageUrl=listing.image.url;
    originalImageUrl=originalImageUrl.replace("/upload","/upload/w_250");
    res.render("listings/edit.ejs",{listing,originalImageUrl});
};

module.exports.updateListing=async(req,res) => {
    let {id}=req.params;
    let listing=await Listing.findByIdAndUpdate(id,{...req.body.listing});
    
    if(typeof req.file !=="undefined") {
      let url=req.file.path;
      let filename=req.file.filename;
      listing.image={url,filename};
      await listing.save();
    }
    req.flash("success","Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing=async(req,res) => {
    let {id}=req.params;
    let deletedListing=await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
     req.flash("success","Listing Deleted!");
    res.redirect("/listings");
};
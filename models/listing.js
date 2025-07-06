const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const Review=require("./review.js");

const listingSchema=new Schema({
  title: {
   type:String,
   required:true,
  },
  description: String,
  image :{
      url:String,
      filename:String,
  },
  price: {
    type:Number,
    default:0
  },
  location: String,
  country: String,
  reviews: [
    {
      type:Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type:Schema.Types.ObjectId,
    ref:"User",
  },
  geometry: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }
});

// Add index for geospatial queries
listingSchema.index({ geometry: '2dsphere' });

// Add a pre-save hook to log geometry data
listingSchema.pre('save', function(next) {
  if (this.image && this.image.url === "") {
    this.image.url = "https://unsplash.com/photos/a-palm-tree-on-a-beach-with-the-ocean-in-the-background-v0h_ZMZuc9Y";
  }
  
  console.log("Pre-save geometry:", this.geometry);
  next();
});

listingSchema.post("/findOneAndDelete",async(listing) => {
  if(listing) {
    await Review.deleteMany({_id:{$in:listing.reviews}});
  }
});

const Listing=mongoose.model("Listing",listingSchema);
module.exports=Listing;


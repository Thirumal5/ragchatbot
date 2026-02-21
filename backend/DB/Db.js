import mongoose from 'mongoose'

const  connectDb=async ()=>{

    try{
       await mongoose.connect(process.env.MONGO_URL);
       console.log("Db is connected Sucessfully");
    }
    catch(err)
    {
      console.log({"Db connection error":err})
    }
}
export default connectDb;
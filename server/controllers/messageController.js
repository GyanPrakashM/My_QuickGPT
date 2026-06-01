

// Text-based AI Chat message  Controller

import axios from "axios"
import openai from '../configs/openai.js';
import Chat from "../models/Chat.js"
import User from "../models/User.js"
import imageKit from "../configs/imageKit.js"
 

 //text genration message controller
export const textMessageController = async (req , res) => {
    try{
        const userId = req.user._id

        // check credits
        if(req.user.credits < 1) {
            return res.json({
                success:false,
                message:"you dont,t have enough credits to use this features"
            })
        }

        const {chatId , prompt} = req.body

        const chat = await Chat.findOne({userId, _id:chatId})
        chat.messages.push({role:"User", content:prompt, timestamp:Date.now(), isImage:false })

        const {choices} = await openai.chat.completions.create({
        model:"gemini-3.5-flash",
        messages:[

        {
            role: "user",
            content: prompt,
        },
    ],
});

    const reply = {...choices[0].message , timestamp:Date.now(), isImage:false}

    chat.messages.push(reply)
    await chat.save()

    await User.updateOne({_id: userId}, {$inc:{credits: -1}})

    res.json({
        success: true, reply
    })
    await chat.save()
    await User.updateOne({_id:userId},{$inc: {credits: -1}})


    } catch(error){
        res.json({success : false , message:error.message})
    }
}

// image genration message controller
export const imageMessageController = async (req, res) =>{
    try{
        const userId = req.user._id;
        // check credits
        if(req.user.credits < 2) {
            return res.json({
                success:false,
                message:"you dont,t have enough credits to use this features"
            })
        }
        const {prompt , chatId , isPublished} = req.body
        // find chat
        const chat = await Chat.findOne({
            userId, _id: chatId
        })

        //push user message
        chat.messages.push({
            role:"User",
            content:prompt, 
            timestamp:Date.now(),
            isImage:false });
           
            

        // encode the prompt
        const encodedPrompt = encodeURIComponent(prompt)

        // construct Imagekit Ai genration URl
        const generatedImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/quickgpt/${Date.now()}.png?tr=w-800,h-800`;

        // trigger genration by fetching from Imagekit
        const aiImageresponse = await axios.get(generatedImageUrl , {responseType:"arraybuffer"})

        // convert to Base64
        const base64Image = `data:image/png;base64,${Buffer.from(aiImageresponse.data,"binary").toString('base64')}`;

        // upload to imagekit media library
        const uploadResponse = await imageKit.upload({
            file:base64Image,
            fileName:`${Date.now()}.png`,
            folder:"quickgpt"
        })
        const reply = {
            role:'assistant', 
            content:uploadResponse.url,
            timestamp:Date.now(),
            isImage:true ,
            isPublished
        }

        res.json({success:true, reply})

        chat.messages.push(reply)
        await chat.save()

        await User.updateOne({_id: userId}, {$inc:{credits: -2}})



    }catch(error){
        res.json({
            success:false,
            message:error.message
        });
    }
}
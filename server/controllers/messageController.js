
import openai from '../configs/openai.js';
import Chat from "../models/Chat.js"
import User from "../models/User.js"

const logGeminiError = (error) => {
    console.error("Gemini API error:", {
        message: error.message,
        status: error.status,
        code: error.code,
        type: error.type,
    });
};

export const textMessageController = async (req , res) => {
    try{
        const userId = req.user._id

        if(req.user.credits < 1) {
            return res.json({
                success:false,
                message:"you dont,t have enough credits to use this features"
            })
        }

        const {chatId , prompt} = req.body

        if(!chatId || !prompt?.trim()){
            return res.json({
                success:false,
                message:"chatId and prompt are required"
            })
        }

        const chat = await Chat.findOne({userId, _id:chatId})
        if(!chat){
            return res.json({
                success:false,
                message:"Chat not found"
            })
        }

        chat.messages.push({role:"user", content:prompt, timestamp:Date.now(), isImage:false })

        let completion;
        try {
            completion = await openai.chat.completions.create({
                model: "gemini-2.5-flash",
                messages:[

                {
                    role: "user",
                    content: prompt,
                },
            ],
        });
        } catch (error) {
            logGeminiError(error);
            return res.status(error.status || 502).json({
                success:false,
                message:"Gemini API request failed. Check GEMINI_API_KEY and model access."
            })
        }

    const reply = {...completion.choices[0].message , timestamp:Date.now(), isImage:false}

    chat.messages.push(reply)
    await chat.save()

    await User.updateOne({_id: userId}, {$inc:{credits: -1}})

    res.json({
        success: true, reply
    })

    } catch(error){
        res.json({success : false , message:error.message})
    }
}

export const imageMessageController = async (req, res) =>{
    try{
        const userId = req.user._id;
        const {prompt , chatId , isPublished} = req.body
        if(!chatId || !prompt?.trim()){
            return res.json({
                success:false,
                message:"chatId and prompt are required"
            })
        }

        const chat = await Chat.findOne({
            userId, _id: chatId
        })
        if(!chat){
            return res.json({
                success:false,
                message:"Chat not found"
            })
        }

        chat.messages.push({
            role:"user",
            content:prompt, 
            timestamp:Date.now(),
            isImage:false });

        const reply = {
            role:'assistant',
            content:"Sorry, image generation is currently under maintenance and is not available at the moment. All other chat features are working normally.",
            timestamp:Date.now(),
            isImage:false,
            isPublished
        }

        chat.messages.push(reply)
        await chat.save()

        res.json({success:true, reply})


    }catch(error){
    console.error("Image message error:", {
        message: error.message,
        status: error.status,
        code: error.code,
    });

    res.json({
        success:false,
        message:error.message
    })
}
}

import React, { useEffect, useRef } from "react";
import {
  isSameSender,
  isSameSenderMargin,
  isSameUser,
  isLastMessage,
} from "../config/ChatLogics";

import { ChatState } from "../Context/ChatProvider";
import { Avatar, Box, Text } from "@chakra-ui/react";


const ScorllableChat = ({ messages }) => {

  const { user } = ChatState();

  const bottomRef = useRef(null);


  useEffect(() => {

    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [messages]);



  return (

    <Box

      height="100%"

      minHeight="0"

      overflowY="scroll"


      px={4}

      py={3}



      css={{

        "&::-webkit-scrollbar": {

          width: "8px",

        },


        "&::-webkit-scrollbar-thumb": {

          background: "rgba(255,255,255,0.35)",

          borderRadius: "10px",

        },


        "&::-webkit-scrollbar-track": {

          background: "transparent",

        },

      }}


    >



      {messages?.map((m,i)=>(


        <Box

          key={m._id}

          display="flex"

          alignItems="center"

          mb={2}

        >



          {

          (

            isSameSender(messages,m,i,user._id)

            ||

            isLastMessage(messages,i,user._id)

          )

          &&



          <Avatar.Root

            size="sm"

            mr={2}

          >


            <Avatar.Image

              src={m.sender?.picture}

            />


            <Avatar.Fallback

              name={m.sender?.name}

            />


          </Avatar.Root>


          }





          <Text


            bg={

              m.sender?._id === user._id

              ?

              "#22D3EE"

              :

              "rgba(255,255,255,0.15)"

            }



            color={

              m.sender?._id === user._id

              ?

              "black"

              :

              "white"

            }



            borderRadius="20px"

            px={4}

            py={2}


            maxW="75%"


            ml={

              isSameSenderMargin(

                messages,

                m,

                i,

                user._id

              )

            }



            mt={

              isSameUser(

                messages,

                m,

                i,

                user._id

              )

              ?

              1

              :

              3

            }



          >


            {m.content}


          </Text>



        </Box>


      ))}



      <div ref={bottomRef}/>



    </Box>


  );

};


export default ScorllableChat;
import React from 'react'
import ScrollableFeed from "react-scrollable-feed";

const ScorllableChat = ({messages}) => {
  return (
      <ScrollableFeed>
          {messages && messages.map((m, i) => (
              <div style={{ display: "flex" }}  key="m._id">
                  
              </div>
          )
        )}
      
    </ScrollableFeed>
  )
}

export default ScorllableChat

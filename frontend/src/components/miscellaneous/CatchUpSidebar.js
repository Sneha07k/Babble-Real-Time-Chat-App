import { Box, Text, Button, VStack } from "@chakra-ui/react";

const CatchUpSidebar = ({ isOpen, onClose, summary }) => {
  if (!isOpen) return null;

  return (
    <>
      <Box
        position="fixed"
        top="0"
        left="0"
        w="100vw"
        h="100vh"
        bg="blackAlpha.500"
        zIndex="999"
        onClick={onClose}
      />

      <Box
        position="fixed"
        top="0"
        right="0"
        w={{ base: "100%", md: "380px" }}
        h="100vh"
        bg="#111827"
        color="white"
        p={5}
        zIndex="1000"
        overflowY="auto"
        borderLeft="1px solid"
        borderColor="whiteAlpha.100"
        boxShadow="-10px 0 30px rgba(0,0,0,0.4)"
        css={{
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#4B5563",
            borderRadius: "999px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "#6B7280",
          },
        }}
      >
        <Text
          fontSize="22px"
          cursor="pointer"
          color="gray.400"
          _hover={{ color: "white" }}
          onClick={onClose}
        >
          ×
        </Text>

        <Text fontSize="xl" fontWeight="700" color="white" textAlign={"center"}>
          AI Catch Up
        </Text>

        <Box
          bg="whiteAlpha.50"
          border="1px solid"
          borderColor="whiteAlpha.100"
          borderRadius="12px"
          p={4}
          mb={6}
          mt={5}
        >
          <Text color="gray.200" lineHeight="1.7">
            {summary?.summary}
          </Text>
        </Box>

        <VStack align="start" spacing={4}>
          {summary?.decisions?.length > 0 && (
            <Box>
              <Text fontWeight="600" color="cyan.300" mb={2}>
                Decisions
              </Text>

              {summary.decisions.map((item, i) => (
                <Text key={i} mb={1}>
                  • {item}
                </Text>
              ))}
            </Box>
          )}

          {summary?.tasks?.length > 0 && (
            <Box>
              <Text fontWeight="600" color="green.300" mb={2}>
                Tasks
              </Text>

              {summary.tasks.map((item, i) => (
                <Text key={i} mb={1}>
                  • {item}
                </Text>
              ))}
            </Box>
          )}

          {summary?.events?.length > 0 && (
            <Box>
              <Text fontWeight="600" color="orange.300" mb={2}>
                Events
              </Text>

              {summary.events.map((item, i) => (
                <Text key={i} mb={1}>
                  • {item}
                </Text>
              ))}
            </Box>
          )}
        </VStack>
      </Box>
    </>
  );
};

export default CatchUpSidebar;

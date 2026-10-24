import React, { useState } from "react";
import { VStack, Text, Button, PinInput, Box } from "@chakra-ui/react";

// "enter the code we emailed you" step, shared by sign-up and login
const OtpStep = ({ email, onVerify, onResend, onBack, loading }) => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const complete = code.join("").length === 6;

  return (
    <VStack gap={5} align="stretch" w="100%" p={5}>
      <Box textAlign="center">
        <Text color="white" fontWeight="600" fontSize="lg">
          Check your email
        </Text>
        <Text color="gray.400" fontSize="sm" mt={1}>
          Enter the 6-digit code we sent to <b>{email}</b>
        </Text>
      </Box>

      <PinInput.Root
        otp
        type="numeric"
        count={6}
        value={code}
        onValueChange={(e) => setCode(e.value)}
        onValueComplete={(e) => onVerify(e.valueAsString)}
        alignSelf="center"
      >
        <PinInput.HiddenInput />
        <PinInput.Control gap={2}>
          {code.map((_, i) => (
            <PinInput.Input
              key={i}
              index={i}
              bg="rgba(255,255,255,0.05)"
              border="1px solid"
              borderColor="rgba(255,255,255,0.12)"
              color="white"
              borderRadius="lg"
              _focus={{
                borderColor: "#22D3EE",
                boxShadow: "0 0 0 1px #22D3EE",
              }}
            />
          ))}
        </PinInput.Control>
      </PinInput.Root>

      <Button
        width="100%"
        onClick={() => onVerify(code.join(""))}
        disabled={!complete}
        loading={loading}
        bg="#22D3EE"
        color="#0B0D12"
        fontWeight="bold"
        borderRadius="lg"
        _hover={{ bg: "#06B6D4" }}
      >
        Verify
      </Button>

      <Box display="flex" justifyContent="space-between" fontSize="sm">
        <Text
          as="button"
          color="gray.400"
          _hover={{ color: "white" }}
          onClick={onBack}
        >
          ← Back
        </Text>
        <Text
          as="button"
          color="#22D3EE"
          _hover={{ color: "#67E8F9" }}
          onClick={onResend}
        >
          Resend code
        </Text>
      </Box>
    </VStack>
  );
};

export default OtpStep;

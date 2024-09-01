'use client'
import { Box, Typography, Button } from "@mui/material";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleStartCall = () => {
    router.push("/call");
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      width="100vw"
      height="100vh"
      alignItems="center"
      justifyContent="center"
      gap={3}
    >
      <Typography variant="h3">AI Audio Call Translation</Typography>
      <Button variant="contained" color="primary" onClick={handleStartCall}>
        Call
      </Button>
    </Box>
  );
}

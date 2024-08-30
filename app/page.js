import { Box, Typography } from "@mui/material";
import Image from "next/image";

export default function Home() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      width="100vw"
      height="100vh"
      alignItems="center"
      justifyContent="center"
    >
      <Typography variant="h3">AI Audio Call Translation</Typography>
    </Box>
  );
}

"use client";
import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { ClerkProvider, SignedIn, SignedOut, SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  const handleStartCall = () => {
    router.push("/call");
  };

  return (
    <Container maxWidth="100vw">
      <AppBar position="static" sx={{ backgroundColor: "#3f51b5" }}>
        <Toolbar>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
            }}
          >
            AI Audio Call Translator
          </Typography>
          <Button color="inherit">
            <Link href="/sign-in" passHref>
              Login
            </Link>
          </Button>
          <Button color="inherit">
            <Link href="/sign-up" passHref>
              Sign Up
            </Link>
          </Button>
        </Toolbar>
      </AppBar>
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
    </Container>
  );
}

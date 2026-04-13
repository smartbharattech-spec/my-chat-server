import { Container, Typography, Button, Card, CardContent } from "@mui/material";

function Home() {
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to MyVastuTool
      </Typography>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="body1">
            Vastu-based tools & calculations for your home.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            Start Tool
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}

export default Home;

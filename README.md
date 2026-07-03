# Seven Days

A narrative pixel-art game about an ethical dilemma, time management, and a world-threatening scientific discovery. This is a one-shot experience where your choices determine the fate of your family and the world.

## Requirements
- Docker

## How to Run

1. Build the Docker image:
   ```bash
   docker build -t seven-days-game .
   ```

2. Run the container:
   ```bash
   docker run -p 8080:80 seven-days-game
   ```

3. Open your browser and navigate to `http://localhost:8080` to play the game.

## Development
To run the game locally for development without Docker:
```bash
python3 -m http.server 8080 --directory public
```

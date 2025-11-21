#!/bin/bash

# Change to the directory where the script is located
cd "$(dirname "$0")"

echo "Starting Antigrav Game Server..."

# Check if port 8000 is already in use
if lsof -i :8000 > /dev/null; then
    echo "Server is already running on port 8000."
else
    echo "Starting Python HTTP server..."
    python3 -m http.server 8000 &
    SERVER_PID=$!
    # Trap the exit signal to kill the server when the script exits
    trap "kill $SERVER_PID" EXIT
    sleep 1
fi

# Open the game in the default web browser
echo "Opening http://localhost:8000 ..."
open http://localhost:8000

echo "Game is running!"
echo "Press Ctrl+C to exit (stops server if started by this script)."

if [ -n "$SERVER_PID" ]; then
    wait $SERVER_PID
else
    # Keep script alive if we didn't start the server, so user can read output
    sleep 999999
fi

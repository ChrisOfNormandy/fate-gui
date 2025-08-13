const DEGS = 360; // Total degrees in a circle

// Get color from an index plus string
export function getColor(index: number, n: number) {
    const colorIndex = (index * (DEGS / n)) % DEGS; // Ensure it's within 0-359
    return `hsl(${colorIndex}, 100%, 50%)`; // HSL color for better visibility
}
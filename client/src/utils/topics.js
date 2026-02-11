// Random topic word lists for the game
export const TOPIC_CATEGORIES = {
    animals: [
        "Elephant", "Penguin", "Dolphin", "Kangaroo", "Giraffe",
        "Octopus", "Butterfly", "Tiger", "Panda", "Koala",
        "Flamingo", "Cheetah", "Polar Bear", "Sloth", "Peacock"
    ],
    foods: [
        "Pizza", "Sushi", "Burger", "Tacos", "Pasta",
        "Ice Cream", "Chocolate", "Popcorn", "Sandwich", "Salad",
        "Pancakes", "Donut", "Ramen", "Curry", "Cheesecake"
    ],
    places: [
        "Beach", "Mountain", "Desert", "Forest", "City",
        "Island", "Castle", "Museum", "Library", "Park",
        "Stadium", "Airport", "Hospital", "School", "Restaurant"
    ],
    objects: [
        "Umbrella", "Guitar", "Camera", "Bicycle", "Clock",
        "Backpack", "Sunglasses", "Headphones", "Laptop", "Phone",
        "Book", "Pillow", "Mirror", "Candle", "Painting"
    ],
    activities: [
        "Swimming", "Dancing", "Cooking", "Reading", "Singing",
        "Painting", "Hiking", "Camping", "Fishing", "Gardening",
        "Photography", "Skateboarding", "Yoga", "Meditation", "Gaming"
    ],
    professions: [
        "Doctor", "Teacher", "Chef", "Artist", "Musician",
        "Engineer", "Pilot", "Firefighter", "Scientist", "Writer",
        "Photographer", "Dancer", "Actor", "Athlete", "Designer"
    ]
};

// Get a random topic from all categories
export function getRandomTopic() {
    const allCategories = Object.values(TOPIC_CATEGORIES);
    const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
    return randomCategory[Math.floor(Math.random() * randomCategory.length)];
}

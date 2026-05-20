import dotenv from 'dotenv';
dotenv.config();
import { query } from "../src/db/pool.ts";

const usernames = [
  "Alpine Badger", "Alpine Bamboo", "Alpine Bear", "Alpine Beaver", "Alpine Bison", 
  "Alpine Caribou", "Alpine Castor", "Alpine Cheetah", "Alpine Cougar", "Alpine Crow", 
  "Alpine Deer", "Alpine Duck", "Alpine Eagle", "Alpine Echo", "Alpine Egret", 
  "Alpine Falcon", "Alpine Fox", "Alpine Gecko", "Alpine Gopher", "Alpine Gorila", 
  "Alpine Hawk", "Alpine Heron", "Alpine Hippo", "Alpine Lynx", "Alpine Marmot", 
  "Alpine Mongoose", "Alpine Moose", "Alpine Mossy", "Alpine Newt", "Alpine Octopus", 
  "Alpine Orca", "Alpine Owl", "Alpine Panda", "Alpine Panther", "Alpine Penguin", 
  "Alpine Pika", "Alpine Porcupine", "Alpine Python", "Alpine Raven", "Alpine Rhino", 
  "Alpine Salmon", "Alpine SeaLion", "Alpine Shark", "Alpine Sloth", "Alpine Spotted", 
  "Alpine Squirrel", "Alpine Storm", "Alpine Stork", "Alpine Swan", "Alpine Tiger", 
  "Alpine Toad", "Alpine Tortoise", "Alpine Trout", "Alpine Viper", "Alpine Vulture", 
  "Alpine Walrus", "Alpine Whale", "Alpine Wolf", "Alpine Zebra", "Arctic Antelope", 
  "Arctic Axolotl", "Arctic Bear", "Arctic Beaver", "Arctic Bison", "Arctic Boa", 
  "Arctic Cactus", "Arctic Chameleon", "Arctic Chimpanzee", "Arctic Chipmunk", "Arctic Cormorant", 
  "Arctic Cougar", "Arctic Crow", "Arctic Duck", "Arctic Echo", "Arctic Elk", 
  "Arctic Falcon", "Arctic Fern", "Arctic Flamingo", "Arctic Fox", "Arctic Frog", 
  "Arctic Gecko", "Arctic Gazelle", "Arctic Gentle", "Arctic Giraffe", "Arctic Golden", 
  "Arctic Gopher", "Arctic Gorilla", "Arctic Gull", "Arctic Hare", "Arctic Hawk", 
  "Arctic Heron", "Arctic Hippo", "Arctic Iguana", "Arctic Jaguar", "Arctic Jay", 
  "Arctic Lemur", "Arctic Leopard", "Arctic Lizard", "Arctic Lynx", "Arctic Manatee", 
  "Arctic Marmot", "Arctic Monkey", "Arctic Mongoose", "Arctic Moose", "Arctic Mossy", 
  "Arctic Newt", "Arctic Octopus", "Arctic Orca", "Arctic Osprey", "Arctic Otter", 
  "Arctic Owl", "Arctic Panther", "Arctic Penguin", "Arctic Pika", "Arctic Porcupine", 
  "Arctic Puffin", "Arctic Python", "Arctic Rabbit", "Arctic Raven", "Arctic Ray", 
  "Arctic Rhino", "Arctic Rusty", "Arctic Salmon", "Arctic SeaLion", "Arctic Seal", 
  "Arctic Shadow", "Arctic Shark", "Arctic Sloth", "Arctic Solar", "Arctic Squirrel", 
  "Arctic Striped", "Arctic Swan", "Arctic Swift", "Arctic Tiger", "Arctic Toad", 
  "Arctic Tortoise", "Arctic Trout", "Arctic Tundra", "Arctic Turtle", "Arctic Viper", 
  "Arctic Vulture", "Arctic Walrus", "Arctic Whale", "Arctic Wolf", "Bamboo Badger", 
  "Bamboo Bear", "Bamboo Falcon", "Bamboo Fox", "Bamboo Gecko", "Bamboo Jaguar", 
  "Bamboo Lynx", "Bamboo Owl", "Bamboo Panda", "Bamboo Pika", "Bamboo Porcupine", 
  "Bamboo Python", "Bamboo Rusty", "Bamboo Squirrely", "Bamboo Storm", "Bamboo Tiger", 
  "Bamboo Viper", "Bamboo Wolf", "Boreal Badger", "Boreal Bamboo", "Boreal Bear", 
  "Boreal Cheetah", "Boreal Condor", "Boreal Cougar", "Boreal Crow", "Boreal Deer", 
  "Boreal Duck", "Boreal Eagle", "Boreal Echo", "Boreal Egret", "Boreal Elk", 
  "Boreal Falcon", "Boreal Fern", "Boreal Flamingo", "Boreal Fox", "Boreal Frog", 
  "Boreal Gazelle", "Boreal Gecko", "Boreal Gentle", "Boreal Giraffe", "Boreal Golden", 
  "Boreal Gopher", "Boreal Gorilla", "Boreal Gull", "Boreal Hare", "Boreal Hawk", 
  "Boreal Hedgehog", "Boreal Heron", "Boreal Hippo", "Boreal Iguana", "Boreal Jaguar", 
  "Boreal Jay", "Boreal Lemur", "Boreal Leopard", "Boreal Lizard", "Boreal Lynx", 
  "Boreal Manatee", "Boreal Marmot", "Boreal Meerkat", "Boreal Monkey", "Boreal Mongoose", 
  "Boreal Moose", "Boreal Mossy", "Boreal Newt", "Boreal Octopus", "Boreal Orca", 
  "Boreal Osprey", "Boreal Otter", "Boreal Owl", "Boreal Panther", "Boreal Penguin", 
  "Boreal Pika", "Boreal Porcupine", "Boreal Puffin", "Boreal Python", "Boreal Rabbit", 
  "Boreal Raven", "Boreal Ray", "Boreal Rhino", "Boreal Rusty", "Boreal Salmon", 
  "Boreal SeaLion", "Boreal Seal", "Boreal Shadow", "Boreal Shark", "Boreal Sloth", 
  "Boreal Solar", "Boreal Squirrel", "Boreal Striped", "Boreal Swan", "Boreal Swift", 
  "Boreal Tiger", "Boreal Toad", "Boreal Tortoise", "Boreal Trout", "Boreal Tundra", 
  "Boreal Turtle", "Boreal Viper", "Boreal Vulture", "Boreal Walrus", "Boreal Whale", 
  "Boreal Wolf", "Cactus Badger", "Cactus Bear", "Cactus Cheetah", "Cactus Cougar", 
  "Cactus Eagle", "Cactus Falcon", "Cactus Fox", "Cactus Gecko", "Cactus Hawk", 
  "Cactus Jaguar", "Cactus Lizard", "Cactus Lynx", "Cactus Monitor", "Cactus Owl", 
  "Cactus Panther", "Cactus Pika", "Cactus Python", "Cactus Raven", "Cactus Rusty", 
  "Cactus Shadow", "Cactus Tiger", "Cactus Viper", "Cactus Wolf", "Canyon Bear", 
  "Canyon Cheetah", "Canyon Cougar", "Canyon Eagle", "Canyon Falcon", "Canyon Fox", 
  "Canyon Hawk", "Canyon Jaguar", "Canyon Lizard", "Canyon Lynx", "Canyon Owl", 
  "Canyon Panther", "Canyon Python", "Canyon Raven", "Canyon Tiger", "Canyon Viper", 
  "Canyon Wolf", "Coastal Albatross", "Coastal Bear", "Coastal Cheetah", "Coastal Cormorant", 
  "Coastal Cougar", "Coastal Dolphin", "Coastal Duck", "Coastal Dugong", "Coastal Eagle", 
  "Coastal Egret", "Coastal Falcon", "Coastal Flamingo", "Coastal Fox", "Coastal Frog", 
  "Coastal Gecko", "Coastal Golden", "Coastal Gull", "Coastal Hawk", "Coastal Heron", 
  "Coastal Iguana", "Coastal Jaguar", "Coastal Lizard", "Coastal Lynx", "Coastal Manatee", 
  "Coastal Newt", "Coastal Octopus", "Coastal Orca", "Coastal Osprey", "Coastal Otter", 
  "Coastal Owl", "Coastal Panther", "Coastal Pelican", "Coastal Penguin", "Coastal Puffin", 
  "Coastal Python", "Coastal Ray", "Coastal Salmon", "Coastal SeaLion", "Coastal Seal", 
  "Coastal Shark", "Coastal Stork", "Coastal Swan", "Coastal Tiger", "Coastal Toad", 
  "Coastal Tortoise", "Coastal Trout", "Coastal Turtle", "Coastal Viper", "Coastal Walrus", 
  "Coastal Whale", "Coastal Wolf", "Desert Badger", "Desert Bear", "Desert Cheetah", 
  "Desert Cougar", "Desert Eagle", "Desert Falcon", "Desert Fox", "Desert Gazelle", 
  "Desert Gecko", "Desert Hawk", "Desert Iguana", "Desert Jaguar", "Desert Lizard", 
  "Desert Lynx", "Desert Meerkat", "Desert Mongoose", "Desert Monitor", "Desert Owl", 
  "Desert Panther", "Desert Porcupine", "Desert Python", "Desert Raven", "Desert Rhino", 
  "Desert Rusty", "Desert Shadow", "Desert Tiger", "Desert Tortoise", "Desert Viper", 
  "Desert Vulture", "Desert Wolf", "Echo Bear", "Echo Falcon", "Echo Fox", 
  "Echo Hawk", "Echo Jaguar", "Echo Lynx", "Echo Owl", "Echo Panther", 
  "Echo Python", "Echo Tiger", "Echo Viper", "Echo Wolf", "Fern Bear", 
  "Fern Falcon", "Fern Fox", "Fern Jaguar", "Fern Lynx", "Fern Owl", 
  "Fern Panther", "Fern Python", "Fern Tiger", "Fern Viper", "Fern Wolf", 
  "Forest Badger", "Forest Bamboo", "Forest Bear", "Forest Beaver", "Forest Bison", 
  "Forest Caribou", "Forest Castor", "Forest Cheetah", "Forest Chimpanzee", "Forest Chipmunk", 
  "Forest Cougar", "Forest Crow", "Forest Deer", "Forest Duck", "Forest Eagle", 
  "Forest Echo", "Forest Egret", "Forest Elk", "Forest Falcon", "Forest Fern", 
  "Forest Flamingo", "Forest Fox", "Forest Frog", "Forest Gazelle", "Forest Gecko", 
  "Forest Gentle", "Forest Giraffe", "Forest Golden", "Forest Gopher", "Forest Gorilla", 
  "Forest Gull", "Forest Hare", "Forest Hawk", "Forest Hedgehog", "Forest Heron", 
  "Forest Hippo", "Forest Iguana", "Forest Jaguar", "Forest Jay", "Forest Lemur", 
  "Forest Leopard", "Forest Lizard", "Forest Lynx", "Forest Marmot", "Forest Meerkat", 
  "Forest Monkey", "Forest Mongoose", "Forest Moose", "Forest Mossy", "Forest Newt", 
  "Forest Orca", "Forest Osprey", "Forest Otter", "Forest Owl", "Forest Panda", 
  "Forest Panther", "Forest Porcupine", "Forest Python", "Forest Rabbit", "Forest Raven", 
  "Forest Rhino", "Forest Rusty", "Forest Salmon", "Forest Shadow", "Forest Shark", 
  "Forest Sloth", "Forest Solar", "Forest Squirrel", "Forest Striped", "Forest Swan", 
  "Forest Swift", "Forest Tiger", "Forest Toad", "Forest Tortoise", "Forest Trout", 
  "Forest Turtle", "Forest Viper", "Forest Vulture", "Forest Wolf"
];

async function seedUsernames() {
  try {
    console.log('Seeding unique anonymous usernames into Neon...');
    
    // Assumes a table named 'anom_user_names' with a text column 'name'
    for (const name of usernames) {
      await query(
        `
        INSERT INTO anon_user_names (name) 
        VALUES ($1) 
        ON CONFLICT (name) DO NOTHING
      `,
      [name]
      );
    }

    console.log('Successfully inserted all usernames.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedUsernames();
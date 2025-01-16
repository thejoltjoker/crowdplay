import { Heart } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

// Mock data for photo posts
const posts = [
  {
    id: 1,
    title: "Sunset at the Beach",
    image: "/placeholder.svg?height=400&width=600",
    likes: 142,
  },
  {
    id: 2,
    title: "City Skyline",
    image: "/placeholder.svg?height=400&width=600",
    likes: 89,
  },
  {
    id: 3,
    title: "Mountain Landscape",
    image: "/placeholder.svg?height=400&width=600",
    likes: 231,
  },
  {
    id: 4,
    title: "Cozy Cafe Corner",
    image: "/placeholder.svg?height=400&width=600",
    likes: 76,
  },
  {
    id: 5,
    title: "Autumn Forest Path",
    image: "/placeholder.svg?height=400&width=600",
    likes: 120,
  },
  {
    id: 6,
    title: "Vibrant Street Art",
    image: "/placeholder.svg?height=400&width=600",
    likes: 154,
  },
];

export function PhotoGrid() {
  return (
    <div className=" mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Photo Gallery</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <Card key={post.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <Image
                  src={post.image}
                  alt={post.title}
                  layout="fill"
                  objectFit="cover"
                  className="transition-transform duration-300 hover:scale-105"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center p-4">
              <h2 className="font-semibold text-lg">{post.title}</h2>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1"
              >
                <Heart className="w-4 h-4" />
                <span>{post.likes}</span>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

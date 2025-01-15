import { firestore } from "@/lib/firestore";
import { Cat } from "@/lib/schemas/cat";
import { where } from "firebase/firestore";
import React, { useEffect, useState } from "react";

export const ListCats: React.FC = () => {
  const [cats, setCats] = useState<Cat[]>([]);
  useEffect(() => {
    firestore.cats.getMany(where("age", "<", 4)).then(setCats);
  }, []);
  return (
    <ul>
      {cats.map((cat) => (
        <li key={cat.id}>{cat.name}</li>
      ))}
    </ul>
  );
};

export const SimpleAddCat: React.FC = () => {
  const [catName, setCatName] = useState("");
  const [catAge, setCatAge] = useState(0);
  const [catBreed, setCatBreed] = useState("");
  const [catPets, setCatPets] = useState(0);

  const handleAddCat = async () => {
    await firestore.cats.set({
      name: catName,
      age: catAge,
      breed: catBreed,
      pets: catPets,
    });
  };

  return (
    <div>
      <input
        type="text"
        value={catName}
        onChange={(e) => setCatName(e.target.value)}
      />
      <input
        type="number"
        value={catAge}
        onChange={(e) => setCatAge(parseInt(e.target.value))}
      />
      <input
        type="text"
        value={catBreed}
        onChange={(e) => setCatBreed(e.target.value)}
      />
      <input
        type="number"
        value={catPets}
        onChange={(e) => setCatPets(parseInt(e.target.value))}
      />
      <button className="bg-blue-500 text-white" onClick={handleAddCat}>
        Add cat
      </button>
    </div>
  );
};

export default SimpleAddCat;

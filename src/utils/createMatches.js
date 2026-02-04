import {
    addDoc,
    collection,
    Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export const createMatches = async (tournamentId, teams, format) => {
    const matchesRef = collection(db, "matches");

    // ROUND ROBIN
    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {

            // First match
            await addDoc(matchesRef, {
                tournamentId,
                teamAId: teams[i].id,
                teamAName: teams[i].name,
                teamBId: teams[j].id,
                teamBName: teams[j].name,
                status: "upcoming",
                totalSets: 3,
                createdAt: Timestamp.now(),
            });

            // 🔥 SECOND LEG (double round robin only)
            if (format === "double-round-robin") {
                await addDoc(matchesRef, {
                    tournamentId,
                    teamAId: teams[j].id,
                    teamAName: teams[j].name,
                    teamBId: teams[i].id,
                    teamBName: teams[i].name,
                    status: "upcoming",
                    totalSets: 3,
                    createdAt: Timestamp.now(),
                });
            }
        }
    }
};

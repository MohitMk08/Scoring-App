import {
    addDoc,
    collection,
    Timestamp,
    getDocs,
    query,
    where,
    writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";

export const createMatches = async (tournamentId, teams, format) => {
    console.log("FORMAT RECEIVED:", format);

    if (teams.length < 2) return;

    /* =============================
       1️⃣ DELETE OLD MATCHES FIRST
       ============================= */
    const oldMatchesQuery = query(
        collection(db, "matches"),
        where("tournamentId", "==", tournamentId)
    );

    const oldMatchesSnap = await getDocs(oldMatchesQuery);
    const batch = writeBatch(db);

    oldMatchesSnap.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    /* =============================
       2️⃣ CREATE NEW MATCHES
       ============================= */
    const matchesRef = collection(db, "matches");

    // ROUND ROBIN
    if (format === "round-robin" || format === "double-round-robin") {
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
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
        return;
    }

    // KNOCKOUT
    if (format === "knockout") {
        const shuffled = [...teams].sort(() => Math.random() - 0.5);

        for (let i = 0; i < shuffled.length; i += 2) {
            if (!shuffled[i + 1]) break;

            await addDoc(matchesRef, {
                tournamentId,
                round: "Quarter Final",
                teamAId: shuffled[i].id,
                teamAName: shuffled[i].name,
                teamBId: shuffled[i + 1].id,
                teamBName: shuffled[i + 1].name,
                status: "upcoming",
                totalSets: 3,
                createdAt: Timestamp.now(),
            });
        }
    }
};

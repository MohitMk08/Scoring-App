import {
    addDoc,
    collection,
    Timestamp,
    getDocs,
    query,
    where,
    writeBatch,
    doc,
    getDoc
} from "firebase/firestore";
import { db } from "../firebase";

export const createMatches = async (tournamentId, teams, format) => {
    console.log("FORMAT RECEIVED:", format);

    if (teams.length < 2) return;

    /* =============================
       🔹 GET TOURNAMENT NAME
    ============================= */
    const tournamentSnap = await getDoc(doc(db, "tournaments", tournamentId));
    const tournamentName = tournamentSnap.exists()
        ? tournamentSnap.data().name
        : "";

    /* =============================
       1️⃣ DELETE OLD MATCHES
    ============================= */
    const oldMatchesQuery = query(
        collection(db, "matches"),
        where("tournamentId", "==", tournamentId)
    );

    const oldMatchesSnap = await getDocs(oldMatchesQuery);
    const batch = writeBatch(db);

    oldMatchesSnap.forEach((docSnap) => batch.delete(docSnap.ref));
    await batch.commit();

    /* =============================
       2️⃣ CREATE NEW MATCHES
    ============================= */
    const matchesRef = collection(db, "matches");

    let matchNumber = 1;

    /* =============================
       🟢 ROUND ROBIN
    ============================= */
    if (format === "round-robin" || format === "double-round-robin") {
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {

                await addDoc(matchesRef, {
                    tournamentId,
                    tournamentName,

                    stage: "league",
                    matchNumber: matchNumber++,
                    round: null,

                    teamAId: teams[i].id,
                    teamAName: teams[i].name,
                    teamALogo: teams[i].logoUrl || "",

                    teamBId: teams[j].id,
                    teamBName: teams[j].name,
                    teamBLogo: teams[j].logoUrl || "",

                    status: "upcoming",
                    totalSets: 3,

                    currentSet: 1,
                    sets: [],
                    history: [],

                    createdAt: Timestamp.now(),
                });

                // 🔁 Double round robin reverse match
                if (format === "double-round-robin") {
                    await addDoc(matchesRef, {
                        tournamentId,
                        tournamentName,

                        stage: "league",
                        matchNumber: matchNumber++,
                        round: null,

                        teamAId: teams[j].id,
                        teamAName: teams[j].name,
                        teamALogo: teams[j].logoUrl || "",

                        teamBId: teams[i].id,
                        teamBName: teams[i].name,
                        teamBLogo: teams[i].logoUrl || "",

                        status: "upcoming",
                        totalSets: 3,

                        currentSet: 1,
                        sets: [],
                        history: [],

                        createdAt: Timestamp.now(),
                    });
                }
            }
        }
        return;
    }

    /* =============================
       🔴 KNOCKOUT
    ============================= */
    if (format === "knockout") {
        const shuffled = [...teams].sort(() => Math.random() - 0.5);

        let roundName = "";

        if (teams.length === 4) roundName = "semifinal";
        else if (teams.length === 8) roundName = "quarterfinal";
        else roundName = "round1";

        let matchNo = 1;

        for (let i = 0; i < shuffled.length; i += 2) {
            if (!shuffled[i + 1]) break;

            await addDoc(matchesRef, {
                tournamentId,
                tournamentName,

                stage: "knockout",
                round: roundName,
                matchNumber: matchNo++,

                teamAId: shuffled[i].id,
                teamAName: shuffled[i].name,
                teamALogo: teams[i].logoUrl || "",   // ✅ ADD THIS

                teamBId: shuffled[i + 1].id,
                teamBName: shuffled[i + 1].name,
                teamBLogo: teams[j].logoUrl || "",   // ✅ ADD THIS

                status: "upcoming",
                totalSets: 3,

                currentSet: 1,
                sets: [],
                history: [],

                createdAt: Timestamp.now(),
            });
        }
    }
};
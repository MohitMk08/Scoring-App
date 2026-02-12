import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function KnockoutWinners() {
    const { tournamentId } = useParams();

    const saveWinners = async () => {
        try {
            await setDoc(
                doc(db, "tournaments", tournamentId, "results", "final"),
                {
                    first: "TEAM_ID_1",
                    second: "TEAM_ID_2",
                    third: "TEAM_ID_3",
                }
            );

            toast.success("Final standings saved");
        } catch (err) {
            console.error(err);
            toast.error("Failed to save tournament winners");
        }
    };

    return (
        <button onClick={saveWinners}>
            Save Tournament Winners
        </button>
    );
}

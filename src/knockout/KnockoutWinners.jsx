import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useParams } from "react-router-dom";

export default function KnockoutWinners() {
    const { tournamentId } = useParams();

    const saveWinners = async () => {
        await setDoc(
            doc(db, "tournaments", tournamentId, "results", "final"),
            {
                first: "TEAM_ID_1",
                second: "TEAM_ID_2",
                third: "TEAM_ID_3"
            }
        );
        alert("Final standings saved");
    };

    return (
        <button onClick={saveWinners}>
            Save Tournament Winners
        </button>
    );
}

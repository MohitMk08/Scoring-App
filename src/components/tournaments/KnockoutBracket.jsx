import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const MatchBox = ({ match, title }) => {
    const navigate = useNavigate();

    const winner = match?.winnerTeamId
        ? match.winnerTeamId === match.teamAId
            ? match.teamAName
            : match.teamBName
        : null;

    const isLive = match?.status === "live";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white shadow-lg rounded-2xl p-3 w-full max-w-xs relative"
        >
            {isLive && (
                <div className="absolute top-2 right-2 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                    <span className="text-xs text-green-600">Live</span>
                </div>
            )}

            <p className="text-xs text-gray-500 mb-2">{title}</p>

            <div className={`p-1 rounded flex justify-between ${winner === match?.teamAName ? "bg-green-100" : ""}`}>
                <span>{match?.teamAName || "TBD"}</span>
                <span className="text-sm font-bold">{match?.sets?.slice(-1)[0]?.teamA ?? ""}</span>
            </div>

            <div className="text-center text-xs text-gray-400">vs</div>

            <div className={`p-1 rounded flex justify-between ${winner === match?.teamBName ? "bg-green-100" : ""}`}>
                <span>{match?.teamBName || "TBD"}</span>
                <span className="text-sm font-bold">{match?.sets?.slice(-1)[0]?.teamB ?? ""}</span>
            </div>

            {match && (
                <button
                    onClick={() => navigate(`/matches/live/${match.id}`)}
                    className="mt-3 w-full bg-indigo-600 text-white py-1 rounded-lg text-sm"
                >
                    {match.status === "finished" ? "View" : match.status === "live" ? "Resume" : "Start"}
                </button>
            )}
        </motion.div>
    );
};

const Connector = () => (
    <div className="flex flex-col items-center">
        <div className="w-1 h-8 bg-gray-400"></div>
    </div>
);

const KnockoutBracket = ({ matches }) => {

    const { sf1, sf2, final, third } = useMemo(() => {
        return {
            sf1: matches.find(m => m.round === "semifinal" && m.matchNumber === 1),
            sf2: matches.find(m => m.round === "semifinal" && m.matchNumber === 2),
            final: matches.find(m => m.round === "final"),
            third: matches.find(m => m.round === "third_place")
        };
    }, [matches]);

    const champion = final?.winnerTeamId
        ? final.winnerTeamId === final.teamAId
            ? final.teamAName
            : final.teamBName
        : null;

    return (
        <div className="mt-10 flex flex-col items-center gap-6">

            {/* SEMIFINALS */}
            <MatchBox match={sf1} title="Semifinal 1" />
            <Connector />
            <MatchBox match={sf2} title="Semifinal 2" />

            {/* FLOW TO FINAL */}
            <Connector />

            {/* FINAL */}
            <MatchBox match={final} title="Final" />

            {/* FLOW TO THIRD PLACE */}
            <Connector />

            {/* THIRD PLACE */}
            <MatchBox match={third} title="3rd Place" />

            {/* CHAMPION */}
            {champion && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mt-6 text-center text-xl font-bold text-yellow-500"
                >
                    🏆 {champion} is Champion
                </motion.div>
            )}
        </div>
    );
};

export default KnockoutBracket;

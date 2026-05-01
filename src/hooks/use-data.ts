import { useContext } from "react";
import { AppDataContext } from "../contexts/data-context";

export default function useData() {
    const context = useContext(AppDataContext);

    if (!context) {
        throw new Error("useData must be used within a DataProvider");
    }

    return context;
}

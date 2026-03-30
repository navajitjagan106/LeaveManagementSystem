import API from "../api/axios";

export const getUser = () =>
    API.get("/leaves/getuserdata")
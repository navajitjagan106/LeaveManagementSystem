export const getHolidaysinRange = async (from: string, to: string, client: any) => {
    const res = await client.query(
        `SELECT date FROM holidays WHERE date BETWEEN $1 AND $2`,
        [from, to]
    );

    return res.rows.map((r: any) =>
        r.date.toISOString().split("T")[0]
    );
};
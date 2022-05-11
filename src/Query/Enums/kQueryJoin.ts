
// type of join in a SELECT statement

export enum kQueryJoin {
    from = "from",
    inner = "inner join",
    left = "left join",
    right = "right join",
    full = "full join",
    cross = "cross join"
}
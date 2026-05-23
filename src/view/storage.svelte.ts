interface QueryPool {
  query: string;
}

const pool: QueryPool = $state({ query: "" });

export { pool };

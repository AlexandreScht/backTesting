export namespace Services {
  namespace Users {
    type findProps = { email: string; oAuthAccount?: boolean } | { id: number };
  }
}

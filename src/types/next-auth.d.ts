import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "SuperAdmin" | "TempleAdmin";
    } & DefaultSession["user"];
  }

  interface User {
    role: "SuperAdmin" | "TempleAdmin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "SuperAdmin" | "TempleAdmin";
  }
}

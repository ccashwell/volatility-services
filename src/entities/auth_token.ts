import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from "typeorm"

@Entity("auth_tokens")
@Index(["type", "token"])
@Index(["type", "owner"])
@Index(["expiry"])
@Unique(["token"])
export class AuthToken {
  // @PrimaryColumn({ nullable: false })
  // hash!: string

  @PrimaryGeneratedColumn()
  id!: number

  @Column({ nullable: false })
  type!: string

  @Column({ nullable: false })
  owner!: string

  @Column({ nullable: true })
  name!: string

  @Column({ nullable: false })
  token!: string

  @Column({ type: "timestamptz", nullable: true })
  expiry!: Date

  @CreateDateColumn()
  createdAt!: Date

  @Column({ type: "timestamptz", nullable: true })
  lastUsedAt!: Date

  @Column({ type: "timestamptz", nullable: true })
  revokedAt!: Date
}

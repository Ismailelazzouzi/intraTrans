import z from "zod"

const body_schema = z.object({
    license: z.string(),
    idVerificationImg: z.string(),
    profession: z.string(),
    description: z.string(),
},)

const pending_review = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

const message_schema = z.object({
    content: z
        .string()
        .trim()
        .min(1, "Message cannot be empty")
        .max(1000, "Message too long")
});

const groupChat_schema = z.object({
  name: z.string().min(1).max(100).optional(),
  participantIds: z.array(z.string().uuid()).min(1).max(50)
})

export {body_schema, pending_review, message_schema, groupChat_schema};
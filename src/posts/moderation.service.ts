import { BadRequestException, Injectable } from "@nestjs/common"
import { legacyModerationApi } from "@/posts/legacy-moderation.client"

export type ModerationResult = {
    blocked: boolean
    reason: string
    raw: unknown
}

@Injectable()
export class ModerationService {
    review(content: string): ModerationResult {
        const moderation = legacyModerationApi.review(content)

        if (moderation === "BLOCK") {
            return { blocked: true, reason: "blocked_by_legacy", raw: moderation }
        }

        if (typeof moderation === "number") {
            return {
                blocked: moderation < 1,
                reason: "blocked_by_score",
                raw: moderation,
            }
        }

        if (typeof moderation === "object") {
            return {
                blocked: !("pass" in moderation && moderation.pass),
                reason: "blocked_by_legacy_object",
                raw: moderation,
            }
        }

        if (moderation === "OK") {
            return { blocked: false, reason: "ok", raw: moderation }
        }

        throw new BadRequestException({ ok: false, error: "Unsupported moderation response" })
    }
}

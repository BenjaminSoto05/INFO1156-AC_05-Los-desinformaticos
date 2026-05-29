import { legacyModerationApi } from "./legacy-moderation.client"

export type ModerationStatus = "OK" | "BLOCK"

export interface ModerationResult {
    status: ModerationStatus
    reason?: string
}

const normalizeModerationResult = (
    result: unknown,
    content: string,
): ModerationResult => {
    if (result === "BLOCK") {
        return { status: "BLOCK", reason: "Contenido bloqueado" }
    }

    if (result === "OK") {
        return { status: "OK" }
    }

    if (typeof result === "number") {
        return { status: "OK", reason: `Legacy rule ${result}` }
    }

    if (typeof result === "object" && result !== null && "pass" in result) {
        const reason = "reason" in result ? String(result.reason) : undefined
        return { status: "OK", reason }
    }

    console.warn("Unknown moderation result", {
        result,
        content,
    })

    return { status: "BLOCK", reason: "Unknown moderation result" }
}

export const legacyModerationAdapter = {
    review(content: string): ModerationResult {
        const result = legacyModerationApi.review(content)
        return normalizeModerationResult(result, content)
    },
}

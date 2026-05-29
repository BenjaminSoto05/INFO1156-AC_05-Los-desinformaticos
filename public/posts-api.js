const POSTS_API_URL = "/api/posts"

/** @typedef {{ id: number, title: string, description: string, imageUrl: string, createdAt: string, updatedAt: string }} Post */
/** @typedef {{ title: string, description: string, imageUrl: string }} CreatePostPayload */

const parseResponse = async (response) => {
    if (response.status === 204) {
        return null
    }

    const contentType = response.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
        return response.json()
    }

    return response.text()
}

const assertOk = async (response) => {
    if (response.ok) {
        return
    }

    const payload = await parseResponse(response)
    let message = `Error HTTP ${response.status}`

    if (typeof payload === "object" && payload && (payload.error || payload.message)) {
        message = String(payload.error || payload.message)
    }

    // If there are validation details, append the first constraint message
    if (typeof payload === "object" && payload && Array.isArray(payload.details) && payload.details.length > 0) {
        const first = payload.details[0]
        if (first && first.constraints) {
            const constraints = Object.values(first.constraints)
            if (constraints.length > 0) {
                message += `: ${constraints[0]}`
            }
        }
    }

    throw new Error(message)
}

export const listPosts = async () => {
    const response = await fetch(POSTS_API_URL)
    await assertOk(response)
    return response.json()
}

export const listFeed = async (mode) => {
    const response = await fetch(`/api/posts/feed?mode=${mode}`)
    await assertOk(response)
    return response.json()
}

export const createPost = async (/** @type {CreatePostPayload} */ payload) => {
    const response = await fetch(POSTS_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    })

    await assertOk(response)
    return response.json()
}

export const addLike = async (postId, payload) => {
    const response = await fetch(`${POSTS_API_URL}/${postId}/likes`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    })

    await assertOk(response)
    return response.json()
}

export const listComments = async (postId) => {
    const response = await fetch(`${POSTS_API_URL}/${postId}/comments`)
    await assertOk(response)
    return response.json()
}

export const createComment = async (postId, payload) => {
    const response = await fetch(`${POSTS_API_URL}/${postId}/comments`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    })

    await assertOk(response)
    return response.json()
}

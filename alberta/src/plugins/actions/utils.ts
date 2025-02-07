export const cleanModelResponse = (response: string) => {
    // Remove think block if present
    const thinkBlockRegex = /<think>[\s\S]*?<\/think>/;
    return response.replace(thinkBlockRegex, '').trim();
}
export async function GET() {
    // Socket.IO endpoint for real-time communication
    return new Response("Socket.IO endpoint", { status: 200 });
}

export const config = {
    api: {
        bodyParser: false,
    },
};

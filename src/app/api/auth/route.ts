import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzMjvXb0K2IrnZz2Eu8ZikQLhuRDkp8Wd57O_AV9ExcNUZR2cMR8bxva8BcnZGGYRHX/exec';

    try {
        const body = await request.json();

        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('API Proxy Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server connection failed: ' + error.message },
            { status: 500 }
        );
    }
}

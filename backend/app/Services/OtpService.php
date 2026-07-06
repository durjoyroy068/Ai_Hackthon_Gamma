<?php

namespace App\Services;

use App\Models\OtpCode;
use Illuminate\Support\Str;

class OtpService
{
    public function send(string $target, string $type): bool
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        OtpCode::query()
            ->where('target', $target)
            ->where('type', $type)
            ->delete();

        OtpCode::create([
            'target' => $target,
            'type' => $type,
            'code' => $code,
            'expires_at' => now()->addMinutes(15),
        ]);

        // In production, send via SMS/email. For dev, log the code.
        logger()->info("OTP for {$target} ({$type}): {$code}");

        return true;
    }

    public function verify(string $target, string $code): bool
    {
        $otp = OtpCode::query()
            ->where('target', $target)
            ->where('code', $code)
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (! $otp) {
            return false;
        }

        $otp->update(['used' => true]);

        return true;
    }
}

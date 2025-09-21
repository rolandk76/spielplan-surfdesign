<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Tournament extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'settings',
        'matches',
        'last_modified',
    ];

    protected $casts = [
        'settings' => 'array',
        'matches' => 'array',
        'last_modified' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($tournament) {
            $tournament->last_modified = now();
        });
        
        static::updating(function ($tournament) {
            $tournament->last_modified = now();
        });
    }
}

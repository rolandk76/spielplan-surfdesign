<?php

use App\Http\Controllers\TournamentController;
use Illuminate\Support\Facades\Route;

Route::get('/', [TournamentController::class, 'index'])->name('home');

Route::resource('tournaments', TournamentController::class);

Route::post('tournaments/{tournament}/matches', [TournamentController::class, 'updateMatch'])
    ->name('tournaments.matches.update');

Route::post('tournaments/{tournament}/reassign-referees', [TournamentController::class, 'reassignReferees'])
    ->name('tournaments.referees.reassign');

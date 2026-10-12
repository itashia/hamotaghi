<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('dormitories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('name');
            $table->string('university');
            $table->text('description')->nullable();
            $table->timestamps();
            $table->index(['university', 'name']);
        });

        Schema::create('rooms', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('dormitory_id')->constrained()->cascadeOnDelete();
            $table->foreignId('owner_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('current_supervisor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('next_supervisor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('manual_supervisor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->unsignedTinyInteger('capacity')->default(5);
            $table->text('description')->nullable();
            $table->string('invite_code', 16)->unique();
            $table->json('supervisor_rotation_order')->nullable();
            $table->date('supervisor_anchor_date')->nullable();
            $table->date('manual_supervisor_week_start')->nullable();
            $table->string('supervisor_period')->nullable();
            $table->timestamps();
            $table->index(['dormitory_id', 'name']);
        });

        Schema::create('room_user', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('role', 16)->default('member');
            $table->string('status', 16)->default('active');
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamp('last_activity_read_at')->nullable();
            $table->timestamps();
            $table->unique(['room_id', 'user_id']);
            $table->index(['user_id', 'status']);
        });

        Schema::create('expenses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payer_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('title');
            $table->unsignedBigInteger('amount');
            $table->string('category', 32);
            $table->date('expense_date');
            $table->text('description')->nullable();
            $table->timestamps();
            $table->index(['room_id', 'expense_date']);
            $table->index(['room_id', 'category', 'payer_id']);
        });

        Schema::create('expense_shares', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('expense_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->unsignedBigInteger('amount');
            $table->timestamps();
            $table->unique(['expense_id', 'user_id']);
        });

        Schema::create('settlements', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->foreignId('from_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('to_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $table->unsignedBigInteger('amount');
            $table->date('settled_on');
            $table->string('note')->nullable();
            $table->timestamps();
            $table->index(['room_id', 'settled_on']);
        });

        Schema::create('room_tasks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assigned_to')->constrained('users')->restrictOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('series_id')->nullable();
            $table->string('occurrence_key')->nullable()->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('due_date');
            $table->string('priority', 16)->default('normal');
            $table->string('status', 16)->default('open');
            $table->string('recurrence', 16)->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['room_id', 'due_date', 'status']);
            $table->index(['room_id', 'assigned_to', 'status']);
        });

        Schema::create('chore_rotations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->string('series_id');
            $table->json('order_ids');
            $table->foreignId('last_assigned_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('generated_occurrence_keys');
            $table->timestamps();
            $table->unique(['room_id', 'series_id']);
        });

        Schema::create('shopping_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->foreignId('added_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->string('quantity')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['room_id', 'completed_at', 'created_at']);
        });

        Schema::create('room_announcements', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->foreignId('author_id')->constrained('users')->restrictOnDelete();
            $table->string('title');
            $table->text('message');
            $table->boolean('pinned')->default(false);
            $table->timestamps();
            $table->index(['room_id', 'pinned', 'created_at']);
        });

        Schema::create('room_activities', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_name');
            $table->string('type', 40);
            $table->string('description');
            $table->text('detail')->nullable();
            $table->timestamps();
            $table->index(['room_id', 'created_at']);
        });

        Schema::create('supervisor_history', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->foreignId('member_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('started_at');
            $table->date('ended_at')->nullable();
            $table->string('kind', 16);
            $table->timestamps();
            $table->index(['room_id', 'started_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supervisor_history');
        Schema::dropIfExists('room_activities');
        Schema::dropIfExists('room_announcements');
        Schema::dropIfExists('shopping_items');
        Schema::dropIfExists('chore_rotations');
        Schema::dropIfExists('room_tasks');
        Schema::dropIfExists('settlements');
        Schema::dropIfExists('expense_shares');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('room_user');
        Schema::dropIfExists('rooms');
        Schema::dropIfExists('dormitories');
    }
};

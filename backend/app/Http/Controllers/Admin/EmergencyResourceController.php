<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmergencyResource;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class EmergencyResourceController extends Controller
{
    public function index(): View
    {
        $resources = EmergencyResource::orderBy('sort_order')->get();

        return view('admin.emergency.index', compact('resources'));
    }

    public function create(): View
    {
        return view('admin.emergency.form', ['resource' => new EmergencyResource()]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        EmergencyResource::create($data);

        return redirect()->route('admin.emergency.index')->with('success', 'Resource created.');
    }

    public function edit(EmergencyResource $emergency): View
    {
        return view('admin.emergency.form', ['resource' => $emergency]);
    }

    public function update(Request $request, EmergencyResource $emergency): RedirectResponse
    {
        $emergency->update($this->validated($request));

        return redirect()->route('admin.emergency.index')->with('success', 'Resource updated.');
    }

    public function destroy(EmergencyResource $emergency): RedirectResponse
    {
        $emergency->delete();

        return redirect()->route('admin.emergency.index')->with('success', 'Resource deleted.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'name_bn' => 'nullable|string|max:255',
            'phone' => 'required|string|max:30',
            'url' => 'nullable|url|max:255',
            'region' => 'required|string|max:100',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
        ]) + ['is_active' => $request->boolean('is_active')];
    }
}

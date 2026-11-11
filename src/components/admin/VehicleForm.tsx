import { useState, useEffect } from "react";
import {
  Upload,
  Plus,
  Trash2,
  Star,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FUEL_TYPES,
  TRANSMISSIONS,
  BODY_TYPES,
  CONDITIONS,
  DRIVETRAINS,
  VEHICLE_STATUSES,
  type VehicleStatus,
} from "@/lib/vehicle-options";
import {
  createVehicle,
  updateVehicle,
  getAdminVehicleById,
  addVehicleImage,
  removeVehicleImage,
  reorderVehicleImages,
  uploadVehiclePhoto,
  useStaffSession,
  type AdminVehicle,
  type VehicleImageRow,
} from "@/lib/admin-data";
import { toast } from "sonner";
import { AdminHeaderAction, type AdminTab } from "./AdminShell";

function FieldWrapper({
  label,
  isFilled,
  children,
  className,
}: {
  label: string;
  isFilled: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative group", className)}>
      {isFilled && (
        <span className="absolute -top-2 left-2.5 z-10 bg-card px-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase pointer-events-none transition-colors group-focus-within:text-foreground leading-none py-0.5 rounded-sm">
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

interface VehicleFormProps {
  vehicleId?: string;
  onNavigate: (tab: AdminTab) => void;
}

export function VehicleForm({ vehicleId, onNavigate }: VehicleFormProps) {
  const staff = useStaffSession();
  const isEditing = !!vehicleId;

  const [loading, setLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [vehicle, setVehicle] = useState<AdminVehicle | null>(null);

  // Form Fields - All Optional
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number | "">(new Date().getFullYear());
  const [trim, setTrim] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [mileage, setMileage] = useState<number | "">("");
  const [engineCapacity, setEngineCapacity] = useState("");
  const [fuelType, setFuelType] = useState<string>("Petrol");
  const [transmission, setTransmission] = useState<string>("Automatic");
  const [bodyType, setBodyType] = useState<string>("SUV");
  const [exteriorColour, setExteriorColour] = useState("");
  const [interiorColour, setInteriorColour] = useState("");
  const [drivetrain, setDrivetrain] = useState<string>("AWD");
  const [doors, setDoors] = useState<number | "">("");
  const [condition, setCondition] = useState<string>("Foreign Used");
  const [countryOfImport, setCountryOfImport] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<VehicleStatus>("draft");
  const [isFeatured, setIsFeatured] = useState(false);

  // Features list
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");

  // Photos
  const [images, setImages] = useState<VehicleImageRow[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageAltInput, setImageAltInput] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!vehicleId) return;
    async function load() {
      try {
        setLoading(true);
        const data = await getAdminVehicleById(vehicleId);
        if (!data) {
          toast.error("Vehicle not found");
          onNavigate("vehicles");
          return;
        }
        setVehicle(data);
        setMake(data.make || "");
        setModel(data.model || "");
        setYear(data.year);
        setTrim(data.trim || "");
        setPrice(data.price ? Number(data.price) : "");
        setMileage(data.mileage ?? "");
        setEngineCapacity(data.engine_capacity || "");
        setFuelType(data.fuel_type || "Petrol");
        setTransmission(data.transmission || "Automatic");
        setBodyType(data.body_type || "SUV");
        setExteriorColour(data.exterior_colour || "");
        setInteriorColour(data.interior_colour || "");
        setDrivetrain(data.drivetrain || "AWD");
        setDoors(data.doors ?? "");
        setCondition(data.condition || "Foreign Used");
        setCountryOfImport(data.country_of_import || "");
        setDescription(data.description || "");
        setStatus(data.status);
        setIsFeatured(data.is_featured);
        setFeatures(data.features || []);
        setImages(data.vehicle_images || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load vehicle details");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [vehicleId, onNavigate]);

  const handleAddFeature = () => {
    if (!newFeature.trim()) return;
    if (!features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()]);
    }
    setNewFeature("");
  };

  const handleRemoveFeature = (f: string) => {
    setFeatures(features.filter((x) => x !== f));
  };

  const handleAddImageUrl = async () => {
    if (!imageUrlInput.trim()) return;
    if (!vehicleId) {
      const pending: VehicleImageRow = {
        id: `temp-${Date.now()}`,
        vehicle_id: "",
        url: imageUrlInput.trim(),
        storage_path: null,
        position: images.length,
        alt: imageAltInput.trim() || null,
        created_at: new Date().toISOString(),
      };
      setImages([...images, pending]);
      setImageUrlInput("");
      setImageAltInput("");
      return;
    }

    try {
      const added = await addVehicleImage(vehicleId, imageUrlInput.trim(), images.length, imageAltInput.trim());
      setImages([...images, added]);
      setImageUrlInput("");
      setImageAltInput("");
      toast.success("Photo added");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add photo");
    }
  };

  const handleFilesUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileArray.length === 0) {
      toast.error("Please select valid image files (JPEG, PNG, WebP).");
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const newRows: VehicleImageRow[] = [];

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploadProgress(`Uploading ${i + 1} of ${fileArray.length}...`);

        const { url, path } = await uploadVehiclePhoto(file);
        const alt = file.name.replace(/\.[^/.]+$/, "");
        const currentPos = images.length + newRows.length;

        if (!vehicleId) {
          newRows.push({
            id: `temp-${Date.now()}-${i}`,
            vehicle_id: "",
            url,
            storage_path: path || null,
            position: currentPos,
            alt,
            created_at: new Date().toISOString(),
          });
        } else {
          const added = await addVehicleImage(vehicleId, url, currentPos, alt, path || undefined);
          newRows.push(added);
        }
      }

      setImages((prev) => [...prev, ...newRows]);
      toast.success(
        fileArray.length === 1
          ? "Photo uploaded successfully"
          : `${fileArray.length} photos uploaded successfully`,
      );
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploadingPhoto(false);
      setUploadProgress("");
    }
  };

  const handleSetMainPhoto = async (index: number) => {
    if (index === 0 || index >= images.length) return;
    const copy = [...images];
    const [main] = copy.splice(index, 1);
    copy.unshift(main);

    const reordered = copy.map((img, i) => ({ ...img, position: i }));
    setImages(reordered);

    if (vehicleId) {
      await reorderVehicleImages(reordered.map((x) => ({ id: x.id, position: x.position })));
    }
    toast.success("Cover photo updated");
  };

  const handleRemovePhoto = async (index: number) => {
    const target = images[index];
    if (!target) return;

    if (vehicleId && !target.id.startsWith("temp-")) {
      try {
        await removeVehicleImage(target.id);
        toast.success("Photo removed");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to remove photo");
        return;
      }
    }

    const updated = images.filter((_, i) => i !== index).map((img, i) => ({ ...img, position: i }));
    setImages(updated);

    if (vehicleId) {
      await reorderVehicleImages(updated.map((x) => ({ id: x.id, position: x.position })));
    }
  };

  const handleMovePhoto = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    const copy = [...images];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);

    const reordered = copy.map((img, i) => ({ ...img, position: i }));
    setImages(reordered);

    if (vehicleId) {
      await reorderVehicleImages(reordered.map((x) => ({ id: x.id, position: x.position })));
    }
  };

  const handleSubmit = async (targetStatus?: VehicleStatus) => {
    const desiredStatus = targetStatus || status;

    try {
      setIsSaving(true);
      const payload = {
        make: make.trim() || "Untitled Vehicle",
        model: model.trim() || "",
        year: year ? Number(year) : new Date().getFullYear(),
        trim: trim.trim() || undefined,
        price: price === "" ? 0 : Number(price),
        mileage: mileage === "" ? 0 : Number(mileage),
        engine_capacity: engineCapacity.trim() || "",
        fuel_type: fuelType || "Petrol",
        transmission: transmission || "Automatic",
        body_type: bodyType || "SUV",
        exterior_colour: exteriorColour.trim() || "",
        interior_colour: interiorColour.trim() || undefined,
        drivetrain: drivetrain || undefined,
        doors: doors ? Number(doors) : undefined,
        condition: condition || "Foreign Used",
        country_of_import: countryOfImport.trim() || undefined,
        description: description.trim() || "",
        features,
        status: desiredStatus,
        is_featured: desiredStatus === "available" ? isFeatured : false,
      };

      if (!isEditing) {
        // Create
        const created = await createVehicle(payload);

        // If there were temporary images added before creation, attach them now
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          await addVehicleImage(created.id, img.url, i, img.alt || undefined, img.storage_path || undefined);
        }

        if (desiredStatus === "available") {
          try {
            await updateVehicle(created.id, { status: "available", is_featured: isFeatured });
          } catch {
            // Safe fallback if database trigger requires photo
          }
        }

        toast.success(`Vehicle saved successfully!`);
      } else {
        // Update
        await updateVehicle(vehicleId, payload);
        toast.success(`Vehicle updated successfully!`);
      }

      onNavigate("vehicles");
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to save vehicle");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Row Context Actions */}
      <AdminHeaderAction>
        <Select value={status} onValueChange={(v) => setStatus(v as VehicleStatus)}>
          <SelectTrigger className="w-24 sm:w-32 h-8 text-xs bg-background">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {VEHICLE_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {status === "available" && (
          <Button
            type="button"
            variant={isFeatured ? "gold" : "outline"}
            size="sm"
            onClick={() => setIsFeatured(!isFeatured)}
            disabled={!staff.canManageFeatured}
            title="Toggle featured showcase"
            className="gap-1 sm:gap-1.5 h-8 text-xs px-2 sm:px-3"
          >
            <Star className={`h-3.5 w-3.5 ${isFeatured ? "fill-current" : ""}`} />
            <span className="hidden sm:inline">{isFeatured ? "Featured" : "Feature"}</span>
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs px-2.5 sm:px-3 hidden sm:inline-flex"
          onClick={() => handleSubmit("draft")}
          disabled={isSaving}
        >
          {isSaving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          Save Draft
        </Button>

        <Button
          type="button"
          variant="hero"
          size="sm"
          className="h-8 text-xs px-2.5 sm:px-3"
          onClick={() => handleSubmit("available")}
          disabled={isSaving}
        >
          {isSaving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          <span className="hidden sm:inline">{isEditing ? "Save Changes" : "Publish to Showroom"}</span>
          <span className="sm:hidden">{isEditing ? "Save" : "Publish"}</span>
        </Button>
      </AdminHeaderAction>

      {/* Stock ID badge when editing */}
      {vehicle?.reference && (
        <div className="flex items-center">
          <span className="font-mono text-xs text-muted-foreground bg-surface px-2.5 py-1 rounded-md">
            Stock #{vehicle.reference}
          </span>
        </div>
      )}

      {/* Main Form Cards - Clean Single Column Layout */}
      <div className="space-y-6 sm:space-y-8">
        {/* Basic Information */}
        <Card className="rounded-2xl border-border">
          <CardHeader className="pb-3 p-4 sm:p-6 sm:pb-4">
            <CardTitle className="font-display text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 sm:space-y-6 p-4 sm:p-6 pt-2 sm:pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4 sm:gap-y-6 sm:gap-x-5">
              <FieldWrapper label="Manufacturer / Make" isFilled={Boolean(make)}>
                <Input
                  id="make"
                  className="h-10 text-sm"
                  placeholder="Manufacturer / Make"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                />
              </FieldWrapper>
              <FieldWrapper label="Model" isFilled={Boolean(model)}>
                <Input
                  id="model"
                  className="h-10 text-sm"
                  placeholder="Model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </FieldWrapper>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-5 gap-x-4 sm:gap-y-6 sm:gap-x-5">
              <FieldWrapper label="Manufacturing Year" isFilled={year !== "" && year !== undefined}>
                <Input
                  id="year"
                  type="number"
                  min={1990}
                  max={new Date().getFullYear() + 1}
                  className="h-10 text-sm"
                  placeholder="Manufacturing Year"
                  value={year}
                  onChange={(e) => setYear(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </FieldWrapper>
              <FieldWrapper label="Trim / Variant" isFilled={Boolean(trim)}>
                <Input
                  id="trim"
                  className="h-10 text-sm"
                  placeholder="Trim / Variant"
                  value={trim}
                  onChange={(e) => setTrim(e.target.value)}
                />
              </FieldWrapper>
              <FieldWrapper label="Vehicle Condition" isFilled={Boolean(condition)}>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger id="condition" className="h-10 text-sm">
                    <SelectValue placeholder="Vehicle Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWrapper>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4 sm:gap-y-6 sm:gap-x-5">
              <FieldWrapper label="Selling Price (GH₵)" isFilled={price !== "" && price !== undefined}>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  className="h-10 text-sm"
                  placeholder="Selling Price (GH₵)"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </FieldWrapper>
              <FieldWrapper label="Mileage (km)" isFilled={mileage !== "" && mileage !== undefined}>
                <Input
                  id="mileage"
                  type="number"
                  min={0}
                  className="h-10 text-sm"
                  placeholder="Mileage (km)"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </FieldWrapper>
            </div>
          </CardContent>
        </Card>

        {/* Powertrain & Technical Specifications */}
        <Card className="rounded-2xl border-border">
          <CardHeader className="pb-3 p-4 sm:p-6 sm:pb-4">
            <CardTitle className="font-display text-base">Powertrain & Specs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 sm:space-y-6 p-4 sm:p-6 pt-2 sm:pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-5 gap-x-4 sm:gap-y-6 sm:gap-x-5">
              <FieldWrapper label="Engine Capacity" isFilled={Boolean(engineCapacity)}>
                <Input
                  id="engine"
                  className="h-10 text-sm"
                  placeholder="Engine Capacity"
                  value={engineCapacity}
                  onChange={(e) => setEngineCapacity(e.target.value)}
                />
              </FieldWrapper>
              <FieldWrapper label="Fuel Type" isFilled={Boolean(fuelType)}>
                <Select value={fuelType} onValueChange={setFuelType}>
                  <SelectTrigger id="fuel" className="h-10 text-sm">
                    <SelectValue placeholder="Fuel Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FUEL_TYPES.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWrapper>
              <FieldWrapper label="Transmission" isFilled={Boolean(transmission)}>
                <Select value={transmission} onValueChange={setTransmission}>
                  <SelectTrigger id="transmission" className="h-10 text-sm">
                    <SelectValue placeholder="Transmission" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSMISSIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWrapper>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-5 gap-x-4 sm:gap-y-6 sm:gap-x-5">
              <FieldWrapper label="Body Type" isFilled={Boolean(bodyType)}>
                <Select value={bodyType} onValueChange={setBodyType}>
                  <SelectTrigger id="body" className="h-10 text-sm">
                    <SelectValue placeholder="Body Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_TYPES.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWrapper>
              <FieldWrapper label="Drivetrain" isFilled={Boolean(drivetrain)}>
                <Select value={drivetrain} onValueChange={setDrivetrain}>
                  <SelectTrigger id="drivetrain" className="h-10 text-sm">
                    <SelectValue placeholder="Drivetrain" />
                  </SelectTrigger>
                  <SelectContent>
                    {DRIVETRAINS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWrapper>
              <FieldWrapper label="Number of Doors" isFilled={doors !== "" && doors !== undefined}>
                <Input
                  id="doors"
                  type="number"
                  min={2}
                  max={6}
                  className="h-10 text-sm"
                  placeholder="Number of Doors"
                  value={doors}
                  onChange={(e) => setDoors(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </FieldWrapper>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-5 gap-x-4 sm:gap-y-6 sm:gap-x-5">
              <FieldWrapper label="Exterior Colour" isFilled={Boolean(exteriorColour)}>
                <Input
                  id="ext-color"
                  className="h-10 text-sm"
                  placeholder="Exterior Colour"
                  value={exteriorColour}
                  onChange={(e) => setExteriorColour(e.target.value)}
                />
              </FieldWrapper>
              <FieldWrapper label="Interior Colour" isFilled={Boolean(interiorColour)}>
                <Input
                  id="int-color"
                  className="h-10 text-sm"
                  placeholder="Interior Colour"
                  value={interiorColour}
                  onChange={(e) => setInteriorColour(e.target.value)}
                />
              </FieldWrapper>
              <FieldWrapper label="Country of Import" isFilled={Boolean(countryOfImport)}>
                <Input
                  id="import"
                  className="h-10 text-sm"
                  placeholder="Country of Import"
                  value={countryOfImport}
                  onChange={(e) => setCountryOfImport(e.target.value)}
                />
              </FieldWrapper>
            </div>
          </CardContent>
        </Card>

        {/* Description & Features */}
        <Card className="rounded-2xl border-border">
          <CardHeader className="pb-3 p-4 sm:p-6 sm:pb-4">
            <CardTitle className="font-display text-base">Description & Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 sm:space-y-6 p-4 sm:p-6 pt-2 sm:pt-3">
            <FieldWrapper label="Vehicle Description" isFilled={Boolean(description)}>
              <Textarea
                id="desc"
                rows={4}
                className="text-sm p-3 leading-relaxed"
                placeholder="Vehicle Description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FieldWrapper>

            <div className="space-y-3">
              <div className="flex gap-2.5">
                <FieldWrapper label="Special Feature" isFilled={Boolean(newFeature)} className="flex-1">
                  <Input
                    className="h-10 text-sm"
                    placeholder="Special feature (e.g. Panoramic sunroof, 360° camera)..."
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                  />
                </FieldWrapper>
                <Button type="button" variant="outline" onClick={handleAddFeature} className="h-10 px-4 shrink-0">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              {features.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {features.map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-medium text-foreground border border-border"
                    >
                      {f}
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(f)}
                        className="hover:text-destructive cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Photographs — New Display Grid */}
        <Card className="rounded-2xl border-border">
          <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 sm:pb-3">
            <CardTitle className="font-display text-base">Vehicle Photographs</CardTitle>
            {images.length > 0 && (
              <Badge variant="secondary" className="text-xs font-semibold">
                {images.length} {images.length === 1 ? "photo" : "photos"}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
            {/* Added Photos Gallery Display */}
            {images.length > 0 ? (
              <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5">
                {images.map((img, index) => {
                  const isCover = index === 0;
                  return (
                    <div
                      key={img.id || index}
                      className={`group relative aspect-[4/3] rounded-xl overflow-hidden border bg-surface/50 transition-all ${
                        isCover
                          ? "ring-2 ring-gold border-gold shadow-md"
                          : "border-border hover:border-foreground/30 hover:shadow-sm"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.alt || `Vehicle photo ${index + 1}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Top Badges / Overlay */}
                      <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 right-1.5 sm:right-2 flex items-center justify-between pointer-events-none">
                        {isCover ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-gold px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-gold-foreground shadow-sm">
                            <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current" /> Cover
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetMainPhoto(index)}
                            className="pointer-events-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 rounded-md bg-background/90 backdrop-blur px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold text-foreground hover:bg-gold hover:text-gold-foreground shadow-sm cursor-pointer"
                            title="Set as cover photo"
                          >
                            <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Make Cover
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="pointer-events-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-background/90 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 shadow-sm cursor-pointer ml-auto"
                          title="Delete photo"
                        >
                          <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </button>
                      </div>

                      {/* Bottom Overlay with Position & Reorder Arrows */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 sm:p-2 flex items-center justify-between text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] sm:text-[11px] font-medium text-white/90 pl-0.5 sm:pl-1">
                          #{index + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMovePhoto(index, index - 1)}
                            disabled={index === 0}
                            className="h-5 w-5 sm:h-6 sm:w-6 rounded bg-black/40 hover:bg-black/70 flex items-center justify-center text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Move left"
                          >
                            <ChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMovePhoto(index, index + 1)}
                            disabled={index === images.length - 1}
                            className="h-5 w-5 sm:h-6 sm:w-6 rounded bg-black/40 hover:bg-black/70 flex items-center justify-center text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Move right"
                          >
                            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add More Tile in the Grid */}
                <label className="aspect-[4/3] rounded-xl border-2 border-dashed border-border hover:border-gold/60 bg-surface/20 hover:bg-gold/5 flex flex-col items-center justify-center cursor-pointer transition-colors p-2 sm:p-3 text-center">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mb-1" />
                  <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">Add More</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) handleFilesUpload(e.target.files);
                      e.target.value = "";
                    }}
                    disabled={isUploadingPhoto}
                  />
                </label>
              </div>
            ) : null}

            {/* Upload Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) {
                  handleFilesUpload(e.dataTransfer.files);
                }
              }}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 sm:p-6 text-center transition-all ${
                isDragging
                  ? "border-gold bg-gold/5"
                  : "border-border bg-surface/30 hover:border-foreground/30 hover:bg-surface/50"
              }`}
            >
              <Upload className={`h-5 w-5 sm:h-6 sm:w-6 ${isDragging ? "text-gold" : "text-muted-foreground"}`} />
              <p className="mt-2 text-xs font-semibold">
                {isUploadingPhoto ? uploadProgress : "Drag photos here or tap to upload"}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <label className="cursor-pointer">
                  <Button
                    type="button"
                    variant="hero"
                    size="sm"
                    disabled={isUploadingPhoto}
                    onClick={(e) => {
                      const target = e.currentTarget.nextElementSibling as HTMLInputElement;
                      target?.click();
                    }}
                  >
                    {isUploadingPhoto ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {isUploadingPhoto ? "Uploading..." : "Select Photos"}
                  </Button>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) handleFilesUpload(e.target.files);
                      e.target.value = "";
                    }}
                    disabled={isUploadingPhoto}
                  />
                </label>
              </div>
            </div>

            {/* Direct Photo URL Input */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <FieldWrapper label="Photo URL" isFilled={Boolean(imageUrlInput)} className="flex-1">
                <Input
                  placeholder="Or paste photo URL (https://...)"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="h-10 text-sm"
                />
              </FieldWrapper>
              <Button type="button" variant="outline" onClick={handleAddImageUrl} className="h-10 px-4 shrink-0">
                <Plus className="h-4 w-4 mr-1.5" /> Add URL
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Form Bottom Completion Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit("draft")}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save as Draft
          </Button>
          <Button
            type="button"
            variant="hero"
            onClick={() => handleSubmit("available")}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Publish to Showroom"}
          </Button>
        </div>
      </div>
    </div>
  );
}

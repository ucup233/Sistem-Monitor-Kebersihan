"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Upload, MapPin, Loader2, Camera } from "lucide-react"
import Link from "next/link"
import { laporanAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function CreateLaporanPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [keterangan, setKeterangan] = useState("")

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Ukuran foto maksimal 5MB",
          variant: "destructive",
        })
        return
      }

      // Check file type
      if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
        toast({
          title: "Error",
          description: "Format foto harus JPG, JPEG, atau PNG",
          variant: "destructive",
        })
        return
      }

      setFoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Browser Anda tidak mendukung GPS",
        variant: "destructive",
      })
      return
    }

    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString())
        setLongitude(position.coords.longitude.toString())
        setIsGettingLocation(false)
        toast({
          title: "Berhasil",
          description: "Lokasi GPS berhasil didapatkan",
        })
      },
      (error) => {
        setIsGettingLocation(false)
        toast({
          title: "Error",
          description: "Gagal mendapatkan lokasi GPS. Pastikan GPS aktif dan izin lokasi diberikan.",
          variant: "destructive",
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!foto) {
      toast({
        title: "Error",
        description: "Foto harus diupload",
        variant: "destructive",
      })
      return
    }

    if (!latitude || !longitude || !keterangan) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      })
      return
    }

    // Validate latitude and longitude
    const lat = Number.parseFloat(latitude)
    const lon = Number.parseFloat(longitude)

    if (isNaN(lat) || isNaN(lon)) {
      toast({
        title: "Error",
        description: "Format latitude atau longitude tidak valid",
        variant: "destructive",
      })
      return
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      toast({
        title: "Error",
        description: "Latitude atau longitude di luar jangkauan",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("foto", foto)
      formData.append("latitude", latitude)
      formData.append("longitude", longitude)
      formData.append("keterangan", keterangan)

      const response = await laporanAPI.create(formData)

      if (response.success) {
        toast({
          title: "Berhasil",
          description: "Laporan berhasil dibuat",
        })
        router.push("/petugas/dashboard")
      } else {
        toast({
          title: "Error",
          description: response.message || "Gagal membuat laporan",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat membuat laporan",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["petugas"]}>
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/petugas/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
            </Link>
          </div>

          <Card className="mx-auto max-w-2xl border-border">
            <CardHeader>
              <CardTitle className="text-2xl">Buat Laporan Baru</CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload foto kondisi kebersihan dan lengkapi informasi lokasi
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Photo Upload */}
                <div className="space-y-2">
                  <Label htmlFor="foto">
                    Foto Laporan <span className="text-destructive">*</span>
                  </Label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Input
                        id="foto"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleFotoChange}
                        className="cursor-pointer"
                      />
                      <Button type="button" variant="outline" onClick={() => document.getElementById("foto")?.click()}>
                        <Camera className="mr-2 h-4 w-4" />
                        Pilih Foto
                      </Button>
                    </div>
                    {fotoPreview && (
                      <div className="relative overflow-hidden rounded-lg border border-border">
                        <img
                          src={fotoPreview || "/placeholder.svg"}
                          alt="Preview"
                          className="h-64 w-full object-cover"
                        />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">Format: JPG, JPEG, PNG. Maksimal 5MB</p>
                  </div>
                </div>

                {/* GPS Location */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>
                      Lokasi GPS <span className="text-destructive">*</span>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={getCurrentLocation}
                      disabled={isGettingLocation}
                    >
                      {isGettingLocation ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Mendapatkan Lokasi...
                        </>
                      ) : (
                        <>
                          <MapPin className="mr-2 h-4 w-4" />
                          Gunakan Lokasi Saya
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="text"
                        placeholder="-7.797068"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="text"
                        placeholder="110.370529"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Klik tombol "Gunakan Lokasi Saya" atau masukkan koordinat manual
                  </p>
                </div>

                {/* Keterangan */}
                <div className="space-y-2">
                  <Label htmlFor="keterangan">
                    Keterangan <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="keterangan"
                    placeholder="Jelaskan kondisi kebersihan yang ditemukan..."
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    rows={5}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Berikan deskripsi yang jelas dan detail</p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Link href="/petugas/dashboard" className="flex-1">
                    <Button type="button" variant="outline" className="w-full bg-transparent">
                      Batal
                    </Button>
                  </Link>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Membuat Laporan...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Buat Laporan
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}
